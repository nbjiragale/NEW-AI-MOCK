import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInterview } from '../contexts/InterviewContext';
import { useMediaStream } from '../hooks/useMediaStream';
import { useInterviewTimer } from '../hooks/useInterviewTimer';
import { useLiveSessionManager, TranscriptItem } from '../hooks/useLiveSessionManager';

import InterviewHeader from '../components/interview/Header';
import CallView from '../components/interview/CallView';
import CodingView from '../components/interview/CodingView';
import { TimeUpModal, LeaveConfirmModal, LeetcodeModal } from '../components/interview/Modals';

const InterviewPage: React.FC = () => {
  const { setupData, interviewQuestions, interviewerDetails, goToSummary } = useInterview();
  
  // High-level UI state
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Custom Hooks for managing complex logic
  const { 
      videoRef, canvasRef, streamLoaded, isCameraOn, isMicOn, isUserSpeaking, 
      recordedFramesRef, toggleCamera, toggleMic, setMicState, setUserMicIntent, streamRef 
  } = useMediaStream(setupData?.recordSession);
  
  const { 
    timeLeft, isTimeUp, inQnaMode, isTimerEnabled, setInQnaMode, formatTime 
  } = useInterviewTimer(setupData);
  
  const {
      transcript, sessionStatus, isReconnecting, isAiSpeaking, sessionManagerRef, activeInterviewerName,
      startSessionManager, handleAskQuestion, handleAskForCandidateQuestions
  } = useLiveSessionManager(setupData, interviewQuestions, interviewerDetails);
  
  // Start session once media stream is ready
  useEffect(() => {
      if (streamLoaded && streamRef.current) {
          startTimeRef.current = Date.now();
          startSessionManager(streamRef.current);
      }
  }, [streamLoaded, streamRef, startSessionManager]);
  
  // Effect to manage microphone state based on AI and user actions
  useEffect(() => {
    setUserMicIntent(currentIntent => {
        if (currentIntent) { // Only control mic if user wants it on
            setMicState(!isAiSpeaking);
        }
        return currentIntent;
    });
  }, [isAiSpeaking, setMicState, setUserMicIntent]);

  // Mute mic when time is up, before user decides to enter Q&A mode
  useEffect(() => {
      if (isTimeUp) {
          setUserMicIntent(false);
          setMicState(false);
      }
  }, [isTimeUp, setMicState, setUserMicIntent]);

  // Handler for leaving the interview
  const handleLeaveCall = useCallback(() => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
      sessionManagerRef.current?.close();
      const endTime = Date.now();
      const durationInSeconds = startTimeRef.current ? Math.round((endTime - startTimeRef.current) / 1000) : 0;
      const finalTranscript = transcript.map(({ speaker, text }) => ({ speaker, text }));
      goToSummary(finalTranscript, durationInSeconds, recordedFramesRef.current);
  }, [streamRef, sessionManagerRef, transcript, goToSummary, recordedFramesRef]);

  const isCombinedMode = setupData?.interviewType === 'Combined';
  const hasHandsOnQuestions = interviewQuestions?.handsOnQuestions && interviewQuestions.handsOnQuestions.length > 0;
  const canShowHandsOnButton = (setupData?.interviewType === 'Technical' || isCombinedMode) && hasHandsOnQuestions;

  return (
    <div className="bg-dark h-screen w-screen flex flex-col text-white font-sans relative">
      <canvas ref={canvasRef} className="hidden" />
      
      <InterviewHeader
        isCodingMode={isCodingMode}
        setIsCodingMode={setIsCodingMode}
        canShowHandsOnButton={canShowHandsOnButton}
        isTimerEnabled={isTimerEnabled}
        timeLeft={timeLeft}
        isTimeUp={isTimeUp}
        formatTime={formatTime}
        sessionStatus={sessionStatus}
        isReconnecting={isReconnecting}
        retryCount={sessionManagerRef.current?.retryCount ?? 0}
      />
      
      <main className="flex flex-1 overflow-hidden">
        {isCodingMode ? (
          <CodingView 
            questions={interviewQuestions.handsOnQuestions}
            videoRef={videoRef}
            isCameraOn={isCameraOn}
            isUserSpeaking={isUserSpeaking}
            isAiSpeaking={isAiSpeaking}
            activeInterviewerName={activeInterviewerName}
            setupData={setupData}
            interviewersDetails={interviewerDetails}
            toggleCamera={toggleCamera}
            toggleMic={toggleMic}
            isMicOn={isMicOn}
            onLeave={() => setShowLeaveConfirm(true)}
          />
        ) : (
          <CallView
            isCombinedMode={isCombinedMode}
            videoRef={videoRef}
            isCameraOn={isCameraOn}
            isUserSpeaking={isUserSpeaking}
            isAiSpeaking={isAiSpeaking}
            activeInterviewerName={activeInterviewerName}
            setupData={setupData}
            interviewersDetails={interviewerDetails}
            transcript={transcript}
            sessionStatus={sessionStatus}
            isReconnecting={isReconnecting}
            onLeave={() => setShowLeaveConfirm(true)}
            toggleCamera={toggleCamera}
            toggleMic={toggleMic}
            isMicOn={isMicOn}
            handleAskQuestion={handleAskQuestion}
          />
        )}
      </main>

      {/* Modals */}
      <TimeUpModal
        isOpen={isTimeUp && !inQnaMode && !showLeaveConfirm}
        onAskQuestions={() => {
            setInQnaMode(true);
            handleAskForCandidateQuestions();
            // Re-enable mic so user can ask their questions
            setUserMicIntent(true);
            setMicState(true);
        }}
        onEndInterview={() => setShowLeaveConfirm(true)}
      />
      <LeaveConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveCall}
      />
    </div>
  );
};

export default InterviewPage;