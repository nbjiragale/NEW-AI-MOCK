import { useState, useEffect, useRef, useCallback } from 'react';

export const useMediaStream = (recordSession: boolean) => {
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [userMicIntent, setUserMicIntent] = useState(true);
    const [streamLoaded, setStreamLoaded] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordedFramesRef = useRef<string[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const isSpeakingRef = useRef(false);

    const setMicState = useCallback((enabled: boolean) => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack && audioTrack.enabled !== enabled) {
                audioTrack.enabled = enabled;
                setIsMicOn(enabled);
            }
        }
    }, []);

    const setupAudioAnalysis = useCallback((stream: MediaStream) => {
        if (!stream.getAudioTracks().length) return;
        const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkSpeaking = () => {
            if (!streamRef.current || !streamRef.current.getAudioTracks()[0]) {
                 if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
                 return;
            };
            if (!streamRef.current.getAudioTracks()[0]?.enabled) {
                if (isSpeakingRef.current) {
                    isSpeakingRef.current = false;
                    setIsUserSpeaking(false);
                }
                animationFrameIdRef.current = requestAnimationFrame(checkSpeaking);
                return;
            }
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0.0;
            for (const value of dataArray) {
                const normalizedValue = (value - 128) / 128.0;
                sum += normalizedValue * normalizedValue;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const speaking = rms > 0.02;

            if (speaking !== isSpeakingRef.current) {
                isSpeakingRef.current = speaking;
                setIsUserSpeaking(speaking);
            }
            animationFrameIdRef.current = requestAnimationFrame(checkSpeaking);
        };
        checkSpeaking();
    }, []);
    
    // Effect to get the media stream
    useEffect(() => {
        let isMounted = true;
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (isMounted) {
                    streamRef.current = stream;

                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        // Set initial state directly from the track's current state
                        setIsCameraOn(videoTrack.enabled);

                        // Add event listeners to sync React state with the track state,
                        // handling changes from browser UI or other sources.
                        videoTrack.onmute = () => setIsCameraOn(false);
                        videoTrack.onunmute = () => setIsCameraOn(true);
                    }

                    setStreamLoaded(true);
                    setupAudioAnalysis(stream);
                }
            } catch (err) {
                console.error("Error accessing media devices.", err);
                if (isMounted) {
                    alert("Could not access camera and microphone. Please check permissions and try again.");
                    setIsCameraOn(false);
                    setIsMicOn(false);
                }
            }
        };
        getMedia();
        return () => {
            isMounted = false;
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            audioContextRef.current?.close().catch(console.error);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    // Clean up event listeners on unmount
                    track.onmute = null;
                    track.onunmute = null;
                    track.stop();
                });
                streamRef.current = null;
            }
        };
    }, [setupAudioAnalysis]);

    // Effect to attach the stream to the video element whenever either is ready.
    // This runs on every render but the inner check prevents unnecessary re-assignments.
    useEffect(() => {
        if (videoRef.current && streamRef.current) {
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
        }
    });
    
    useEffect(() => {
        if (!recordSession || !isCameraOn || !videoRef.current || !canvasRef.current || !streamLoaded) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const captureFrame = () => {
            if (video.readyState >= 2) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const frameData = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                if (frameData) recordedFramesRef.current.push(frameData);
            }
        };
        const intervalId = setInterval(captureFrame, 5000);
        return () => clearInterval(intervalId);
    }, [recordSession, isCameraOn, streamLoaded]);

    const toggleCamera = useCallback(async () => {
        if (!streamRef.current) return;
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            // By changing the 'enabled' property, we trigger the 'onmute' or 'onunmute'
            // event listeners added in the useEffect hook, which handles updating the state.
            // This ensures state is synced from a single source of truth (the track itself).
            videoTrack.enabled = !videoTrack.enabled;
        }
    }, []);


    const toggleMic = useCallback(() => {
        const newIntent = !userMicIntent;
        setUserMicIntent(newIntent);
        setMicState(newIntent);
    }, [userMicIntent, setMicState]);

    return {
        videoRef, canvasRef, streamRef, isCameraOn, isMicOn, userMicIntent, streamLoaded, isUserSpeaking, recordedFramesRef,
        toggleCamera, toggleMic, setMicState, setUserMicIntent
    };
};