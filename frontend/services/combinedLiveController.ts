// Fix: Removed `LiveSession` as it is not an exported type from `@google/genai`.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// --- Audio Decoding and Encoding Utilities (Shared) ---

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

// --- Controller Interfaces ---

type Persona = 'technical' | 'behavioral' | 'hr';

interface Interviewer {
    name: string;
    role: string;
}

interface CategorizedQuestions {
    technicalQuestions?: string[];
    behavioralQuestions?: string[];
    hrQuestions?: string[];
    handsOnQuestions?: any[];
}

interface ControllerCallbacks {
  onTranscriptionUpdate: (update: { speaker: string; text: string }) => void;
  onAudioStateChange: (isSpeaking: boolean) => void;
}

interface ControllerParams {
    interviewers: Interviewer[];
    questions: CategorizedQuestions;
    callbacks: ControllerCallbacks;
    setupData: any;
}

// --- The Combined Live Controller ---

export class CombinedLiveController {
    private ai: GoogleGenAI;
    // Fix: Using `any` as `LiveSession` is not an exported type. The session object has `close()` and `sendRealtimeInput()` methods.
    private sessions: Record<Persona, any | null> = { technical: null, behavioral: null, hr: null };
    private sessionPromises: Record<Persona, Promise<any> | null> = { technical: null, behavioral: null, hr: null };
    private activePersona: Persona | null = null;
    private isClosing = false;

    private userStream: MediaStream | null = null;
    private inputAudioContext: AudioContext | null = null;
    private outputAudioContext: AudioContext;
    private scriptProcessorNode: ScriptProcessorNode | null = null;
    
    private callbacks: ControllerCallbacks;
    private interviewers: Record<Persona, Interviewer>;
    private questions: CategorizedQuestions;
    private setupData: any;
    
    private conversationHistory: { speaker: string; text: string }[] = [];
    private sources = new Set<AudioBufferSourceNode>();
    private nextStartTime = 0;

    constructor({ interviewers, questions, callbacks, setupData }: ControllerParams) {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        this.callbacks = callbacks;
        this.questions = questions;
        this.setupData = setupData;
        
        this.interviewers = {
            technical: interviewers.find(i => i.role === 'Software Engineer')!,
            behavioral: interviewers.find(i => i.role === 'Hiring Manager')!,
            hr: interviewers.find(i => i.role === 'HR Specialist')!,
        };
        
        this.outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    public async start(stream: MediaStream) {
        this.userStream = stream;

        const techConfig = this.getSessionConfig('technical');
        const behavioralConfig = this.getSessionConfig('behavioral');
        const hrConfig = this.getSessionConfig('hr');

        this.sessionPromises.technical = this._createSession('technical', techConfig);
        this.sessionPromises.behavioral = this._createSession('behavioral', behavioralConfig);
        this.sessionPromises.hr = this._createSession('hr', hrConfig);

        const [techSession, behavioralSession, hrSession] = await Promise.all([
            this.sessionPromises.technical,
            this.sessionPromises.behavioral,
            this.sessionPromises.hr,
        ]);
        
        this.sessions.technical = techSession;
        this.sessions.behavioral = behavioralSession;
        this.sessions.hr = hrSession;

        this._setupAudioProcessing();

        // Kick off the interview with a greeting from HR
        this.activePersona = 'hr';
        this.sessions.hr?.sendRealtimeInput({ text: 'GREET_CANDIDATE' });
    }

    public askQuestion(type: Persona) {
        if (this.isClosing || !this.sessions[type]) return;

        this.activePersona = type;
        const activeSession = this.sessions[type];

        // Context Synchronization
        const historySummary = this.conversationHistory.slice(-4).map(turn => `${turn.speaker}: ${turn.text}`).join('\n');
        const contextPrompt = `CONTEXT_SYNC: Here is a summary of the most recent conversation:\n${historySummary}\n\nYou are now the active interviewer. Based on the candidate's last response, either ask a sharp, relevant follow-up question, or proceed to the next question on your list. Make the conversation feel natural.`;
        
        activeSession?.sendRealtimeInput({ text: contextPrompt });
    }

    public askForCandidateQuestions() {
        if (this.isClosing) return;

        // The Hiring Manager (behavioral persona) is best suited to handle candidate questions.
        this.activePersona = 'behavioral';
        const activeSession = this.sessions.behavioral;
        if (activeSession) {
            activeSession.sendRealtimeInput({ text: 'The main interview time is up. The candidate now has some questions for you. Please say something like "Absolutely, I\'d be happy to answer any questions you have. What\'s on your mind?" and then wait for their question.' });
        }
    }

    public close() {
        if (this.isClosing) return;
        this.isClosing = true;
        console.log("Closing all sessions...");
        
        this.scriptProcessorNode?.disconnect();
        this.inputAudioContext?.close().catch(console.error);
        this.outputAudioContext.close().catch(console.error);

        Object.values(this.sessions).forEach(session => session?.close());
    }

    private getSessionConfig(persona: Persona) {
        const { name } = this.interviewers[persona];
        let questionList = '';
        let voiceName: 'Kore' | 'Puck' | 'Zephyr' = 'Zephyr';

        switch(persona) {
            case 'technical':
                questionList = [
                    ...(this.questions.technicalQuestions || []),
                    ...(this.questions.handsOnQuestions || []).map(q => `For your hands-on challenge: ${q.title}. ${q.description}`)
                ].map((q, i) => `${i+1}. ${q}`).join('\n');
                voiceName = 'Kore'; // Female Voice A
                break;
            case 'behavioral':
                questionList = (this.questions.behavioralQuestions || []).map((q, i) => `${i+1}. ${q}`).join('\n');
                voiceName = 'Puck'; // Male Voice
                break;
            case 'hr':
                questionList = (this.questions.hrQuestions || []).map((q, i) => `${i+1}. ${q}`).join('\n');
                voiceName = 'Zephyr'; // Female Voice B
                break;
        }

        const managerName = this.interviewers.behavioral.name;
        const engineerName = this.interviewers.technical.name;

        const candidateName = this.setupData.candidateName || 'there';
        const companyName = this.setupData.targetCompany || 'our company';

        const hrExperience = Math.floor(Math.random() * 3) + 4; // 4-6
        const managerExperience = Math.floor(Math.random() * 3) + 5; // 5-7
        const engineerExperience = Math.floor(Math.random() * 3) + 6; // 6-8

        const introduction = `you must begin the interview by greeting the candidate, ${candidateName}, by name. Then, introduce the panel. Say something like: "Hi ${candidateName}, welcome! My name is ${name}. I'm an HR Specialist here at ${companyName} and I've been with the company for about ${hrExperience} years. Joining us today are ${managerName}, one of our Hiring Managers who has been with us for ${managerExperience} years, and ${engineerName}, a Senior Engineer on the team who has been here for ${engineerExperience} years."`;

        const systemInstruction = `You are ${name}, an expert interviewer with a helpful and supportive mindset. You are part of a panel interview.
Your specific role is: ${this.interviewers[persona].role}.
Here is your list of main questions to guide your part of the conversation:\n${questionList}

**Your Conversational Style (VERY IMPORTANT):**
- **Engage, Don't Just Interrogate:** Your primary goal is a natural, two-way conversation. When it's your turn to speak, you are in control of the conversation until the next interviewer is activated.
- **Acknowledge and Validate:** After the candidate answers, briefly acknowledge their response. Use phrases like "That's an interesting approach," "Thanks for sharing that detail," or "I see."
- **Provide Gentle Feedback:** If an answer is good, offer brief, positive reinforcement ("That's a great example."). If an answer is unclear or weak, gently probe for more information ("Could you elaborate on that point?" or "How did you handle the outcome?") instead of just moving on.
- **Ask Follow-up Questions:** Based on the candidate's answer, ask one relevant follow-up question to dig deeper. This is key to making the conversation feel real. Only after the follow-up should you move to the next main question from your list.
- **Natural Transitions:** Use smooth transitions when moving to the next main question. For example: "Okay, that makes sense. Let's switch gears a bit..." or "Great, thanks for clarifying. The next thing I'd like to discuss is..."

**Panel Interview Rules:**
- You must ONLY speak when you are the active interviewer. Do NOT announce your name when you speak.
- You will be prompted with 'CONTEXT_SYNC: ...' before you are asked to speak. This will give you the latest part of the conversation so you can jump in smoothly.
- If you are ${name} (HR Specialist) and you receive the command 'GREET_CANDIDATE', ${introduction} After introducing everyone, ask a simple conversational question like "How are you doing today?" or "Ready to get started?". Wait for their response, and then proceed with the very first question from your list.`;
        
        return { systemInstruction, voiceName };
    }

    private _createSession(persona: Persona, config: { systemInstruction: string, voiceName: string }): Promise<any> {
        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        return this.ai.live.connect({
            // Fix: Corrected typo in model name.
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => console.log(`Session opened for ${persona}.`),
                onclose: () => console.log(`Session closed for ${persona}.`),
                onerror: (e) => console.error(`Session error for ${persona}:`, e),
                onmessage: async (message: LiveServerMessage) => {
                    if (this.isClosing) return;

                    // Handle Transcription
                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        currentOutputTranscription += text;
                        if(this.activePersona === persona) this.callbacks.onTranscriptionUpdate({ speaker: this.interviewers[persona].name, text: currentOutputTranscription });
                    } else if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        currentInputTranscription += text;
                        this.callbacks.onTranscriptionUpdate({ speaker: 'You', text: currentInputTranscription });
                    }

                    if (message.serverContent?.turnComplete) {
                        if (currentInputTranscription) this.conversationHistory.push({ speaker: 'You', text: currentInputTranscription });
                        if (currentOutputTranscription) this.conversationHistory.push({ speaker: this.interviewers[persona].name, text: currentOutputTranscription });
                        currentInputTranscription = '';
                        currentOutputTranscription = '';
                    }

                    // Handle Audio Playback (queued globally)
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        this.callbacks.onAudioStateChange(true);
                        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
                        const source = this.outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(this.outputAudioContext.destination);
                        
                        source.addEventListener('ended', () => {
                            this.sources.delete(source);
                            if (this.sources.size === 0) {
                                this.callbacks.onAudioStateChange(false);
                            }
                        });

                        source.start(this.nextStartTime);
                        this.nextStartTime += audioBuffer.duration;
                        this.sources.add(source);
                    }
                    
                    if (message.serverContent?.interrupted) {
                        for (const source of this.sources.values()) {
                            source.stop();
                        }
                    }
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } } },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: config.systemInstruction,
            }
        });
    }

    private _setupAudioProcessing() {
        if (!this.userStream) return;
        this.inputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = this.inputAudioContext.createMediaStreamSource(this.userStream);
        this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(1024, 1, 1);
        
        this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
            if (this.isClosing || !this.activePersona) return;
            
            const activeSessionPromise = this.sessionPromises[this.activePersona];
            if (!activeSessionPromise) return;

            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);

            activeSessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        };
        source.connect(this.scriptProcessorNode);
        this.scriptProcessorNode.connect(this.inputAudioContext.destination);
    }
}