import {
  useEffect,
  useRef,
  useState,
} from "react";


/* =========================================================
   Browser Speech Recognition Types
========================================================= */

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent
  extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent
  extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;

  continuous: boolean;

  interimResults: boolean;

  maxAlternatives: number;

  start: () => void;

  stop: () => void;

  abort: () => void;

  onstart:
    | (() => void)
    | null;

  onend:
    | (() => void)
    | null;

  onerror:
    | ((event: SpeechRecognitionErrorEvent) => void)
    | null;

  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

/* =========================================================
   Window Type
========================================================= */

interface WindowWithSpeechRecognition
  extends Window {

  SpeechRecognition?:
    SpeechRecognitionConstructor;

  webkitSpeechRecognition?:
    SpeechRecognitionConstructor;
}

/* =========================================================
   Props
========================================================= */

interface SpeechToTextProps {

  onTranscript?: (
    transcript: string
  ) => void;

  onStart?: () => void;

  onEnd?: () => void;
}

/* =========================================================
   Component
========================================================= */

function SpeechToText({
  onTranscript,
  onStart,
  onEnd,
}: SpeechToTextProps) {

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null
    );

  const [
    isListening,
    setIsListening,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    browserSupported,
    setBrowserSupported,
  ] = useState(true);

  /* =======================================================
     Create Speech Recognition
  ======================================================= */

  useEffect(() => {

    const speechWindow =
      window as WindowWithSpeechRecognition;

    const SpeechRecognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      setBrowserSupported(false);

      return;

    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "en-GB";

    recognition.continuous =
      true;

    recognition.interimResults =
      true;

    recognition.maxAlternatives =
      1;

    /* =====================================================
       Started
    ===================================================== */

    recognition.onstart =
      () => {

        console.log(
          "Speech recognition started"
        );

        setIsListening(true);

        setError("");

        onStart?.();

      };

    /* =====================================================
       Results
    ===================================================== */

    recognition.onresult =
      (
        event: SpeechRecognitionEvent
      ) => {

        let transcript = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {

          transcript +=
            event.results[i][0]
              .transcript;

        }

        transcript =
          transcript.trim();

        if (transcript) {

          onTranscript?.(
            transcript
          );

        }

      };

    /* =====================================================
       Error
    ===================================================== */

    recognition.onerror =
      (
        event: SpeechRecognitionErrorEvent
      ) => {

        console.error(
          "Speech recognition error:",
          event.error
        );

        /*
         * "aborted" normally means
         * recognition was stopped by
         * the browser/application.
         *
         * Don't show this as a scary
         * user-facing error.
         */

        if (
          event.error !==
          "aborted"
        ) {

          if (
            event.error ===
            "not-allowed"
          ) {

            setError(
              "Microphone permission was denied. Please allow microphone access."
            );

          } else if (
            event.error ===
            "no-speech"
          ) {

            setError(
              "No speech was detected. Please try speaking again."
            );

          } else {

            setError(
              "Speech recognition could not continue. Please try again."
            );

          }

        }

        setIsListening(
          false
        );

      };

    /* =====================================================
       End
    ===================================================== */

    recognition.onend =
      () => {

        console.log(
          "Speech recognition ended"
        );

        setIsListening(
          false
        );

        onEnd?.();

      };

    recognitionRef.current =
      recognition;

    return () => {

      recognition.onstart =
        null;

      recognition.onresult =
        null;

      recognition.onerror =
        null;

      recognition.onend =
        null;

      try {

        recognition.abort();

      } catch {

        // Ignore cleanup errors

      }

      recognitionRef.current =
        null;

    };

  }, [
    onTranscript,
    onStart,
    onEnd,
  ]);

  /* =======================================================
     Start
  ======================================================= */

  const handleStart =
    () => {

      const recognition =
        recognitionRef.current;

      if (!recognition) {

        setError(
          "Speech recognition is not supported in this browser."
        );

        return;

      }

      try {

        setError("");

        recognition.start();

      } catch (error) {

        console.error(
          "Could not start speech recognition:",
          error
        );

        /*
         * Browser can throw InvalidStateError
         * if start() is called while recognition
         * is already running.
         */

        if (
          error instanceof DOMException &&
          error.name ===
            "InvalidStateError"
        ) {

          return;

        }

        setError(
          "Unable to start speech recognition. Please try again."
        );

      }

    };

  /* =======================================================
     Stop
  ======================================================= */

  const handleStop =
    () => {

      const recognition =
        recognitionRef.current;

      if (!recognition) {
        return;
      }

      try {

        recognition.stop();

      } catch (error) {

        console.error(
          "Could not stop speech recognition:",
          error
        );

      }

    };

  /* =======================================================
     Unsupported Browser
  ======================================================= */

  if (!browserSupported) {

    return (

      <div className="speech-to-text">

        <p className="speech-error">

          Speech recognition is not supported
          in this browser. Please use Google
          Chrome or another supported browser.

        </p>

      </div>

    );

  }

  /* =======================================================
     UI
  ======================================================= */

  return (

    <div className="speech-to-text">

      <button
        type="button"
        className={
          isListening
            ? "speech-to-text__button listening"
            : "speech-to-text__button"
        }
        onClick={
          isListening
            ? handleStop
            : handleStart
        }
      >

        {isListening
          ? "⏹ Stop Speaking"
          : "🎙️ Start Speaking"}

      </button>

      {isListening && (

        <span className="speech-to-text__status">

          Listening...

        </span>

      )}

      {error && (

        <p className="speech-error">

          {error}

        </p>

      )}

    </div>

  );
}

export default SpeechToText;