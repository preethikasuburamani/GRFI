// import { useRef, useState } from 'react';

// const AIInterviewPage = () => {

//     const videoRef = useRef<HTMLVideoElement | null>(null);
//     const [answer, setAnswer] = useState<string>("");

//     const HandleCameraAndAudio = async  () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//             if (videoRef.current) {
//                 videoRef.current.srcObject = stream;

//             }
//         } catch (error) {
//             console.error("Error accessing camera and audio:", error);
//         }
//     }

    
//   return (
//     <div>
//         <button onClick={HandleCameraAndAudio}>
//             Start Vedio and Audio
//         </button>

//         <video autoPlay ref = {videoRef} muted playsInline></video>

       
        
//     </div>
//   )
// }

// export default AIInterviewPage

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

const AIInterviewPage = () => {
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

export default AIInterviewPage;