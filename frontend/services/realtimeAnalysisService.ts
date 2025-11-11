import { analyzeEyeContact } from './geminiForRealtimeAnalysis';

export interface RealtimeAnalysisCallbacks {
    onEyeContactChange: (status: 'good' | 'poor') => void;
}

export class RealtimeAnalysisService {
    private videoElement: HTMLVideoElement;
    private canvasElement: HTMLCanvasElement;
    private callbacks: RealtimeAnalysisCallbacks;
    private intervalId: number | null = null;
    private isAnalyzing = false;
    private poorContactCount = 0;
    private isStopped = false;

    constructor(
        videoElement: HTMLVideoElement,
        canvasElement: HTMLCanvasElement,
        callbacks: RealtimeAnalysisCallbacks
    ) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.callbacks = callbacks;
    }

    public start() {
        if (this.intervalId) return; // Already running
        this.isStopped = false;
        // Check for eye contact every 7 seconds
        this.intervalId = window.setInterval(this.checkForPoorEyeContact, 7000);
    }

    public stop() {
        this.isStopped = true;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private checkForPoorEyeContact = async () => {
        if (this.isAnalyzing || this.videoElement.paused || this.videoElement.ended || this.videoElement.readyState < 2 || this.isStopped) {
            return;
        }
        this.isAnalyzing = true;

        try {
            const frame = this.captureFrame();
            if (!frame) return;

            const result = await analyzeEyeContact(frame);

            // If the service was stopped during the API call, do not update state.
            if (this.isStopped) return;

            if (result.hasGoodEyeContact) {
                this.poorContactCount = 0; // Reset counter
                this.callbacks.onEyeContactChange('good');
            } else {
                this.poorContactCount++;
                // Only trigger 'poor' status after two consecutive detections to avoid flicker/false positives
                if (this.poorContactCount >= 2) {
                    this.callbacks.onEyeContactChange('poor');
                }
            }
        } catch (error) {
            console.error("Error during eye contact analysis loop:", error);
            // On error, reset to good to avoid persistent false alarms
            if (!this.isStopped) {
                this.poorContactCount = 0;
                this.callbacks.onEyeContactChange('good');
            }
        } finally {
            this.isAnalyzing = false;
        }
    }

    private captureFrame(): string | null {
        const context = this.canvasElement.getContext('2d');
        if (!context) return null;

        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Return base64 data, stripping the 'data:image/jpeg;base64,' prefix
        return this.canvasElement.toDataURL('image/jpeg', 0.5).split(',')[1];
    }
}