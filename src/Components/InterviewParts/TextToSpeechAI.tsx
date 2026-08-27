import { useEffect, useRef, useState } from "react";

interface TextToSpeechAIProps {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
}

function TextToSpeechAI({
  text,
  onStart,
  onEnd,
}: TextToSpeechAIProps) {

  const [
    isSpeaking,
    setIsSpeaking,
  ] = useState(false);

  const utteranceRef =
    useRef<SpeechSynthesisUtterance | null>(null);

  /*
   * Speak the question
   */
  const speak = () => {

    if (!text.trim()) {
      return;
    }

    /*
     * Stop anything currently speaking.
     */
    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {

      setIsSpeaking(true);

      onStart?.();

    };

    utterance.onend = () => {

      setIsSpeaking(false);

      onEnd?.();

    };

    utterance.onerror = () => {

      setIsSpeaking(false);

      onEnd?.();

    };

    utteranceRef.current =
      utterance;

    window.speechSynthesis.speak(
      utterance
    );
  };

  /*
   * Automatically speak when
   * the question changes.
   */
  useEffect(() => {

    if (!text.trim()) {
      return;
    }

    const timer =
      window.setTimeout(() => {

        speak();

      }, 500);

    return () => {

      window.clearTimeout(timer);

      window.speechSynthesis.cancel();

      setIsSpeaking(false);

    };

  }, [text]);

  /*
   * Cleanup when component
   * is removed.
   */
  useEffect(() => {

    return () => {

      window.speechSynthesis.cancel();

    };

  }, []);

  return (

    <div className="ai-audio-status">

      <button
        type="button"
        onClick={speak}
        disabled={isSpeaking}
      >

        {isSpeaking
          ? "🔊 Speaking..."
          : "🔊 Hear Question"}

      </button>

    </div>

  );
}

export default TextToSpeechAI;