import {
  useEffect,
  useRef,
  useState,
} from "react";

/* =========================================================
   Speech Recognition Types
========================================================= */

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem;
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
}

interface SpeechRecognitionErrorEvent
  extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start: () => void;
  stop: () => void;
  abort: () => void;

  onstart:
    | (() => void)
    | null;

  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null;

  onerror:
    | ((event: SpeechRecognitionErrorEvent) => void)
    | null;

  onend:
    | (() => void)
    | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionWindow
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
  value: string;

  onTranscriptChange: (
    transcript: string
  ) => void;

  onListeningChange?: (
    isListening: boolean
  ) => void;
}

/* =========================================================
   Component
========================================================= */

function SpeechToText({
  value,
  onTranscriptChange,
  onListeningChange,
}: SpeechToTextProps) {

  /* =======================================================
     Recognition
  ======================================================= */

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null
    );

  /* =======================================================
     Listening Ref

     We use a ref as well as state so that browser
     callbacks always know the latest value.
  ======================================================= */

  const isListeningRef =
    useRef(false);

  /* =======================================================
     State
  ======================================================= */

  const [isListening, setIsListening] =
    useState(false);

  const [speechError, setSpeechError] =
    useState("");

  /* =======================================================
     Keep Parent Listening State Updated
  ======================================================= */

  const updateListeningState = (
    listening: boolean
  ) => {

    isListeningRef.current =
      listening;

    setIsListening(listening);

    onListeningChange?.(
      listening
    );
  };

  /* =======================================================
     Create Speech Recognition
     
     IMPORTANT:
     We only create the recognition object once.
  ======================================================= */

  useEffect(() => {

    const browserWindow =
      window as SpeechRecognitionWindow;

    const SpeechRecognitionAPI =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    /* =====================================================
       Browser Support
    ===================================================== */

    if (!SpeechRecognitionAPI) {

      setSpeechError(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );

      return;

    }

    /* =====================================================
       Create Recognition
    ===================================================== */

    const recognition =
      new SpeechRecognitionAPI();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-GB";

    /* =====================================================
       START
    ===================================================== */

    recognition.onstart = () => {

      console.log(
        "Speech recognition started"
      );

      setSpeechError("");

      updateListeningState(true);

    };

    /* =====================================================
       RESULT
    ===================================================== */

    recognition.onresult = (
      event: SpeechRecognitionEvent
    ) => {

      let transcript = "";

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {

        const result =
          event.results[i];

        transcript +=
          result[0].transcript;

      }

      onTranscriptChange(
        transcript.trim()
      );

    };

    /* =====================================================
       ERROR
    ===================================================== */

    recognition.onerror = (
      event: SpeechRecognitionErrorEvent
    ) => {

      /*
       * "aborted" happens when recognition is
       * intentionally stopped.
       *
       * We do NOT show it as an application error.
       */

      if (
        event.error === "aborted"
      ) {

        console.log(
          "Speech recognition stopped."
        );

        return;

      }

      console.error(
        "Speech recognition error:",
        event.error
      );

      let errorMessage =
        "Something went wrong with speech recognition.";

      if (
        event.error ===
        "not-allowed"
      ) {

        errorMessage =
          "Microphone permission was denied. Please allow microphone access in Chrome.";

      }

      if (
        event.error ===
        "no-speech"
      ) {

        errorMessage =
          "No speech was detected. Please try speaking again.";

      }

      if (
        event.error ===
        "audio-capture"
      ) {

        errorMessage =
          "No microphone was detected. Please check your microphone.";

      }

      setSpeechError(
        errorMessage
      );

      updateListeningState(false);

    };

    /* =====================================================
       END
    ===================================================== */

    recognition.onend = () => {

      console.log(
        "Speech recognition ended"
      );

      updateListeningState(false);

    };

    /* =====================================================
       Save Instance
    ===================================================== */

    recognitionRef.current =
      recognition;

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {

      recognition.onstart =
        null;

      recognition.onresult =
        null;

      recognition.onerror =
        null;

      recognition.onend =
        null;

      recognition.abort();

      recognitionRef.current =
        null;

    };

  }, []);

  /* =======================================================
     START SPEAKING
  ======================================================= */

  const startListening = () => {

    const recognition =
      recognitionRef.current;

    if (!recognition) {

      setSpeechError(
        "Speech recognition is not available."
      );

      return;

    }

    /*
     * Don't start another recognition
     * session if already listening.
     */

    if (
      isListeningRef.current
    ) {

      return;

    }

    setSpeechError("");

    try {

      recognition.start();

    } catch (error) {

      console.error(
        "Unable to start speech recognition:",
        error
      );

    }

  };

  /* =======================================================
     STOP SPEAKING
  ======================================================= */

  const stopListening = () => {

    const recognition =
      recognitionRef.current;

    if (!recognition) {
      return;
    }

    if (
      !isListeningRef.current
    ) {

      return;

    }

    /*
     * stop() tells the browser:
     *
     * "Finish processing the current
     * speech and then stop."
     *
     * This is preferable to abort()
     * when the user clicks Stop.
     */

    recognition.stop();

  };

  /* =======================================================
     CLEAR ANSWER
  ======================================================= */

  const clearTranscript = () => {

    onTranscriptChange("");

    setSpeechError("");

  };

  /* =======================================================
     UI
  ======================================================= */

  return (

    <div className="speak-answer">

      {/* =================================================
          MICROPHONE
      ================================================= */}

      <div
        className={
          isListening
            ? "microphone-button listening"
            : "microphone-button"
        }
      >

        🎙️

      </div>

      {/* =================================================
          STATUS
      ================================================= */}

      <h3>

        {isListening
          ? "Listening..."
          : "Ready when you are"}

      </h3>

      <p>

        Speak naturally.
        Your answer will appear
        as text below.

      </p>

      {/* =================================================
          START / STOP
      ================================================= */}

      <button
        type="button"
        className="speak-button"
        onClick={
          isListening
            ? stopListening
            : startListening
        }
      >

        {isListening
          ? "Stop Speaking"
          : "Start Speaking"}

      </button>

      {/* =================================================
          ERROR
      ================================================= */}

      {speechError && (

        <div className="speech-error">

          {speechError}

        </div>

      )}

      {/* =================================================
          TRANSCRIPT
      ================================================= */}

      <div className="speech-transcript">

        {value
          ? value
          : "Your speech transcript will appear here..."}

      </div>

      {/* =================================================
          CLEAR
      ================================================= */}

      {value &&
        !isListening && (

          <button
            type="button"
            className="clear-speech-button"
            onClick={
              clearTranscript
            }
          >

            Clear Answer

          </button>

        )}

    </div>

  );
}

export default SpeechToText;