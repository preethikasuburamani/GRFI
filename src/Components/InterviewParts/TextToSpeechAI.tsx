import { useEffect, useState } from "react";

/* =========================================================
   Props
========================================================= */

interface TextToSpeechAIProps {
  question: string;
  autoSpeak?: boolean;
}

/* =========================================================
   Component
========================================================= */

function TextToSpeechAI({
  question,
  autoSpeak = true,
}: TextToSpeechAIProps) {

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  /* =======================================================
     Speak Question
  ======================================================= */

  const speakQuestion = () => {

    if (!question.trim()) {
      return;
    }

    /* Stop previous speech */

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        question
      );

    utterance.lang = "en-GB";

    utterance.rate = 0.95;

    utterance.pitch = 1;

    utterance.volume = 1;

    /* =====================================================
       Speech Started
    ===================================================== */

    utterance.onstart = () => {

      setIsSpeaking(true);

    };

    /* =====================================================
       Speech Finished
    ===================================================== */

    utterance.onend = () => {

      setIsSpeaking(false);

    };

    /* =====================================================
       Speech Error
    ===================================================== */

    utterance.onerror = (
      error
    ) => {

      console.error(
        "Text-to-speech error:",
        error
      );

      setIsSpeaking(false);

    };

    /* Speak */

    window.speechSynthesis.speak(
      utterance
    );

  };

  /* =======================================================
     Automatically Speak New Question
  ======================================================= */

  useEffect(() => {

    if (!autoSpeak) {
      return;
    }

    const timer =
      window.setTimeout(() => {

        speakQuestion();

      }, 500);

    return () => {

      window.clearTimeout(timer);

      window.speechSynthesis.cancel();

      setIsSpeaking(false);

    };

  }, [question, autoSpeak]);

  /* =======================================================
     Cleanup
  ======================================================= */

  useEffect(() => {

    return () => {

      window.speechSynthesis.cancel();

    };

  }, []);

  /* =======================================================
     UI
  ======================================================= */

  return (

    <div className="ai-speech-controls">

      <div className="ai-speech-status">

        <span>
          {isSpeaking
            ? "🔊"
            : "🔈"}
        </span>

        <span>

          {isSpeaking
            ? "AI interviewer speaking..."
            : "AI interviewer"}

        </span>

      </div>

      {/* Audio animation */}

      {isSpeaking && (

        <div className="ai-speaking-bars">

          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />

        </div>

      )}

      {/* Speak Again */}

      <button
        type="button"
        onClick={speakQuestion}
        disabled={isSpeaking}
        className="ai-speak-again"
      >

        {isSpeaking
          ? "Speaking..."
          : "🔊 Speak Question"}

      </button>

    </div>

  );
}

export default TextToSpeechAI;