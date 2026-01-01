import { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please allow microphone access.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }

  function handleSend() {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      setAudioBlob(null);
      setRecordingTime(0);
    }
  }

  function handleCancel() {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    onCancel();
  }

  const minutes = Math.floor(recordingTime / 60);
  const seconds = recordingTime % 60;

  if (!isRecording && !audioBlob) {
    return (
      <button
        onClick={startRecording}
        className="p-3 hover:bg-gray-800 rounded-lg transition-all text-xl"
        title="Record voice note"
      >
        🎙️
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-red-600/10 border border-red-600/30 rounded-lg">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="font-mono text-sm">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-sm text-gray-400">Recording...</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-all"
          >
            ⏹ Stop
          </button>
        </>
      ) : audioBlob ? (
        <>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">🎙️</span>
            <span className="text-sm">
              Voice note ({minutes}:{seconds.toString().padStart(2, '0')})
            </span>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
          >
            Send
          </button>
        </>
      ) : null}
    </div>
  );
}