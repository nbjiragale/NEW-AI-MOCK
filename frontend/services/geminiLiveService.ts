// Fix: Removed unused 'Content' import as the history parameter is not supported.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// --- Audio Decoding and Encoding Utilities ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Live Session Service ---

interface TranscriptItem {
    speaker: string;
    text: string;
}

interface InitiateLiveSessionParams {
  stream: MediaStream;
  systemInstruction: string;
  onTranscriptionUpdate: (update: { speaker: 'Interviewer' | 'You'; text: string; isFinal: boolean; }) => void;
  onAudioStateChange: (isSpeaking: boolean) => void;
  onError: (e: ErrorEvent) => void;
  history: Omit<TranscriptItem, 'id'>[];
}

export const initiateLiveSession = async ({
  stream,
  systemInstruction,
  onTranscriptionUpdate,
  onAudioStateChange,
  onError,
  history
}: InitiateLiveSessionParams): Promise<{ close: () => void; askForCandidateQuestions: () => void; }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const inputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  const sources = new Set<AudioBufferSourceNode>();
  let nextStartTime = 0;
  
  let currentInputTranscription = '';
  let currentOutputTranscription = '';
  let isClosing = false; // Flag to prevent multiple close calls

  let finalSystemInstruction = systemInstruction;
  if (history.length > 0) {
      const historyText = history.map(item => `${item.speaker}: ${item.text}`).join('\n');
      finalSystemInstruction += `\n\n---
PREVIOUS CONVERSATION HISTORY (for your context):
${historyText}
\n---\n
You were disconnected. Please resume the conversation naturally from where you left off. The last thing said was: "${history[history.length - 1].text}".`;
  }


  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    // Fix: Removed the 'history' parameter as it is not a valid property for ai.live.connect.
    // The conversation context is managed by the live session itself.
    callbacks: {
      onopen: () => {
        console.log('Live session opened.');
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(1024, 1, 1);
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscription += text;
            onTranscriptionUpdate({ speaker: 'Interviewer', text: currentOutputTranscription, isFinal: false });
        } else if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscription += text;
            onTranscriptionUpdate({ speaker: 'You', text: currentInputTranscription, isFinal: false });
        }

        if (message.serverContent?.turnComplete) {
            if (currentOutputTranscription) {
                onTranscriptionUpdate({ speaker: 'Interviewer', text: currentOutputTranscription, isFinal: true });
                currentOutputTranscription = '';
            }
            if (currentInputTranscription) {
                onTranscriptionUpdate({ speaker: 'You', text: currentInputTranscription, isFinal: true });
                currentInputTranscription = '';
            }
        }

        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          if (sources.size === 0) {
            onAudioStateChange(true);
          }
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputAudioContext.destination);
          
          source.addEventListener('ended', () => {
            sources.delete(source);
            if (sources.size === 0) {
              onAudioStateChange(false);
            }
          });

          source.start(nextStartTime);
          nextStartTime = nextStartTime + audioBuffer.duration;
          sources.add(source);
        }

        const interrupted = message.serverContent?.interrupted;
        if (interrupted) {
          for (const source of sources.values()) {
            source.stop();
            sources.delete(source);
          }
          nextStartTime = 0;
          onAudioStateChange(false);
        }
      },
      onerror: (e: ErrorEvent) => {
        console.error('Live session error:', e);
        onError(e);
      },
      onclose: (e: CloseEvent) => {
        console.log('Live session closed.');
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: finalSystemInstruction,
    },
  });

  const session = await sessionPromise;

  return {
    close: () => {
      if (isClosing) return; // Guard against multiple calls
      isClosing = true;
      session.close();
      inputAudioContext.close().catch(console.error);
      outputAudioContext.close().catch(console.error);
    },
    askForCandidateQuestions: () => {
      // This prompt instructs the AI to invite questions from the candidate.
      session.sendRealtimeInput({ text: 'The interview time is up. The candidate has questions for you. Please say "Of course, what questions do you have for me?" and then wait for their question.' });
    },
  };
};