import { useState } from "react";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
  }
}

const SpeechToText = () => {
  const [answer, setAnswer] = useState("");

  const startListening = () => {
    const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognitionAPI) {
  console.error("Speech recognition is not supported in this browser.");
  return;
}

const recognition = new SpeechRecognitionAPI();

    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setAnswer(transcript);
    };

    recognition.start();
  };

  return (
    <div>
      <button onClick={startListening}>
        🎤 Speak Answer
      </button>

      <p>{answer}</p>
    </div>
  );
};

export default SpeechToText;