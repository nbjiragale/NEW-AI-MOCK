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

// --- Combined Live Session Service ---

interface Interviewer {
    name: string;
    role: 'Software Engineer' | 'Hiring Manager' | 'HR Specialist';
}

interface CategorizedQuestions {
    technicalQuestions?: string[];
    behavioralQuestions?: string[];
    hrQuestions?: string[];
    handsOnQuestions?: any[]; // Keep this flexible
}

interface InitiateCombinedLiveSessionParams {
  stream: MediaStream;
  interviewers: Interviewer[];
  questions: CategorizedQuestions;
  onTranscriptionUpdate: (update: { speaker: string; text: string }) => void;
  onAudioStateChange: (isSpeaking: boolean) => void;
}

export const initiateCombinedLiveSession = async ({
  stream,
  interviewers,
  questions,
  onTranscriptionUpdate,
  onAudioStateChange,
}: InitiateCombinedLiveSessionParams): Promise<{ close: () => void; askQuestion: (type: 'technical' | 'behavioral' | 'hr') => void; }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const engineer = interviewers.find(i => i.role === 'Software Engineer');
    const manager = interviewers.find(i => i.role === 'Hiring Manager');
    const hr = interviewers.find(i => i.role === 'HR Specialist');

    if (!engineer || !manager || !hr) {
        throw new Error("Could not find all required interviewer roles for the combined session.");
    }
    
    // Combine theory and hands-on for the engineer's question list
    const technicalQuestionList = [
        ...(questions.technicalQuestions || []),
        ...(questions.handsOnQuestions || []).map(q => `For your hands-on challenge: ${q.title}. ${q.description}`)
    ].map((q, i) => `${i+1}. ${q}`).join('\n');

    const behavioralQuestionList = (questions.behavioralQuestions || []).map((q, i) => `${i+1}. ${q}`).join('\n');
    const hrQuestionList = (questions.hrQuestions || []).map((q, i) => `${i+1}. ${q}`).join('\n');

    const systemInstruction = `You are an AI assistant playing the role of an interview panel. There are three interviewers:
1. ${engineer?.name} (Software Engineer): Asks deep technical and hands-on coding questions. Persona is sharp, focused, and technical.
2. ${manager?.name} (Hiring Manager): Asks behavioral and situational questions (STAR method). Persona is professional, calm, and interested in past performance.
3. ${hr?.name} (HR Specialist): Asks questions about cultural fit, career goals, and motivation. Persona is friendly, welcoming, and represents the company values.

The candidate will control the flow by asking for a specific type of question.

YOUR TASK:
- When the candidate says they are ready for a "technical" question, you MUST respond as ${engineer?.name} and ask the NEXT UNASKED question from this list:\n${technicalQuestionList}
- When the candidate says they are ready for a "behavioral" question, you MUST respond as ${manager?.name} and ask the NEXT UNASKED question from this list:\n${behavioralQuestionList}
- When the candidate says they are ready for an "HR" question, you MUST respond as ${hr?.name} and ask the NEXT UNASKED question from this list:\n${hrQuestionList}

CRITICAL RULES:
- Only ask ONE question at a time. Do not list multiple questions.
- Wait for the user's full answer before you are prompted again.
- You MUST preface your response with the interviewer's name. Example: "${engineer?.name}: ". This is essential for the system to identify who is speaking. Do not include the role in your spoken response.
- Start the interview by having ${hr?.name} say: "Welcome. We are your panel for today. I'm ${hr?.name}, and we also have ${manager?.name}, our Hiring Manager, and ${engineer?.name}, our Senior Engineer. To begin, please ask for a technical, behavioral, or HR question whenever you're ready."
`;
  
    const inputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const sources = new Set<AudioBufferSourceNode>();
    let nextStartTime = 0;
    
    let currentInputTranscription = '';
    let currentOutputTranscription = '';

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
        onopen: () => {
            console.log('Combined live session opened.');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then((session) => {
                if (stream.getAudioTracks()[0].enabled) {
                session.sendRealtimeInput({ media: pcmBlob });
                }
            });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputTranscription += text;
                const match = currentOutputTranscription.match(/^([^:]+):\s/);
                const speaker = match ? match[1].trim() : 'Interviewer';
                onTranscriptionUpdate({ speaker, text: currentOutputTranscription });

            } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscription += text;
                onTranscriptionUpdate({ speaker: 'You', text: currentInputTranscription });
            }

            if (message.serverContent?.turnComplete) {
                currentInputTranscription = '';
                currentOutputTranscription = '';
            }

            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
                onAudioStateChange(true);
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
            systemInstruction,
        },
    });

    const session = await sessionPromise;

    const askQuestion = (type: 'technical' | 'behavioral' | 'hr') => {
        session.sendRealtimeInput({ text: `I am ready for the next ${type} question.` });
    };

    return {
        close: () => {
            session.close();
            inputAudioContext.close().catch(console.error);
            outputAudioContext.close().catch(console.error);
        },
        askQuestion,
    };
};