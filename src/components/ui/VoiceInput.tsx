import { Mic, MicOff } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange: (val: string) => void;
  value: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onValueChange,
  value,
  className = "node-field-input",
  ...rest
}) => {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecording = useCallback(() => {
    if (!supported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onValueChange(value ? `${value} ${transcript}` : transcript);
    };
    rec.onerror = () => setRecording(false);
    rec.onend   = () => setRecording(false);

    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }, [supported, value, onValueChange]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <div className="node-input-row">
      <input
        {...rest}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={className}
      />
      {supported && (
        <button
          type="button"
          className={`voice-btn ${recording ? "recording" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); recording ? stopRecording() : startRecording(); }}
          title={recording ? "Stop recording" : "Voice input"}
          aria-label={recording ? "Stop voice input" : "Start voice input"}
        >
          {recording ? <MicOff size={13} /> : <Mic size={13} />}
        </button>
      )}
    </div>
  );
};

interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange: (val: string) => void;
  value: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const VoiceTextarea: React.FC<VoiceTextareaProps> = ({
  onValueChange,
  value,
  className = "node-field-textarea",
  textareaRef,
  ...rest
}) => {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecording = useCallback(() => {
    if (!supported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onValueChange(value ? `${value}\n${transcript}` : transcript);
    };
    rec.onerror = () => setRecording(false);
    rec.onend   = () => setRecording(false);

    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }, [supported, value, onValueChange]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <div className="node-textarea-row">
      <textarea
        {...rest}
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={className}
      />
      {supported && (
        <button
          type="button"
          className={`voice-btn-float ${recording ? "recording" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); recording ? stopRecording() : startRecording(); }}
          title={recording ? "Stop recording" : "Voice input"}
          aria-label={recording ? "Stop voice input" : "Start voice input"}
        >
          {recording ? <MicOff size={11} /> : <Mic size={11} />}
        </button>
      )}
    </div>
  );
};
