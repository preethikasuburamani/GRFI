import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./AIInterviewPage.css";

import SpeechToText from "../../Components/InterviewParts/SpeechToText";

import TextToSpeechAI from "../../Components/InterviewParts/TextToSpeechAI";

/* =========================================================
   Interview Question
========================================================= */

interface InterviewQuestion {
  id: number;
  question: string;
}

/* =========================================================
   Mock Questions
========================================================= */

const mockQuestions: InterviewQuestion[] = [
  {
    id: 1,
    question:
      "Tell me about your experience working with React and TypeScript.",
  },
  {
    id: 2,
    question:
      "Can you explain how you manage state in a React application?",
  },
  {
    id: 3,
    question:
      "Tell me about a challenging frontend problem you have solved.",
  },
];

/* =========================================================
   Interview Page
========================================================= */

function InterviewPage() {

  /* =======================================================
     CAMERA
  ======================================================= */

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  /* =======================================================
     STATE
  ======================================================= */

  const [cameraError, setCameraError] =
    useState("");

  const [isCameraOn, setIsCameraOn] =
    useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [answerMode, setAnswerMode] =
    useState<"type" | "speak">("type");

  const [answer, setAnswer] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const currentQuestion =
    mockQuestions[currentQuestionIndex];

  /* =======================================================
     CAMERA + MICROPHONE
  ======================================================= */

  useEffect(() => {

    const startMedia = async () => {

      try {

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        mediaStreamRef.current =
          stream;

        if (videoRef.current) {

          videoRef.current.srcObject =
            stream;

        }

        setIsCameraOn(true);

      } catch (error) {

        console.error(
          "Camera / microphone error:",
          error
        );

        setCameraError(
          "Camera and microphone permission is required for the interview."
        );

      }

    };

    startMedia();

    /* =====================================================
       Cleanup Camera
    ===================================================== */

    return () => {

      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) => {

          track.stop();

        });

    };

  }, []);

  /* =======================================================
     ANSWER CHANGE
  ======================================================= */

  const handleAnswerChange = (
    value: string
  ) => {

    setAnswer(value);

  };

  /* =======================================================
     LISTENING STATE
  ======================================================= */

  const handleListeningChange = (
    listening: boolean
  ) => {

    setIsListening(listening);

  };

  /* =======================================================
     SUBMIT ANSWER
  ======================================================= */

  const handleSubmitAnswer = () => {

    if (!answer.trim()) {
      return;
    }

    console.log(
      "Question:",
      currentQuestion.question
    );

    console.log(
      "Candidate Answer:",
      answer
    );

    /* =====================================================
       Next Question
    ===================================================== */

    if (
      currentQuestionIndex <
      mockQuestions.length - 1
    ) {

      setCurrentQuestionIndex(
        (previous) =>
          previous + 1
      );

      setAnswer("");

      setAnswerMode("type");

      setIsListening(false);

    } else {

      console.log(
        "Interview completed"
      );

    }

  };

  /* =======================================================
     TYPE MODE
  ======================================================= */

  const handleTypeMode = () => {

    setAnswerMode("type");

  };

  /* =======================================================
     SPEAK MODE
  ======================================================= */

  const handleSpeakMode = () => {

    setAnswerMode("speak");

  };

  /* =======================================================
     JSX
  ======================================================= */

  return (

    <main className="realtime-interview">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="realtime-interview__header">

        <div>

          <div className="realtime-interview__logo">
            GRFI
          </div>

          <span>
            AI Interview Practice
          </span>

        </div>

        <div className="realtime-interview__progress">

          Question{" "}
          {currentQuestionIndex + 1}
          {" "}of{" "}
          {mockQuestions.length}

        </div>

        <button
          type="button"
          className="realtime-interview__exit"
        >

          End Interview

        </button>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="realtime-interview__content">

        {/* =================================================
            AI INTERVIEWER
        ================================================= */}

        <section className="ai-interviewer">

          <div className="ai-interviewer__top">

            <span className="ai-interviewer__status">

              ● AI Interviewer

            </span>

            <span className="ai-interviewer__speaking">

              🔊 AI Voice

            </span>

          </div>

          {/* AI Avatar */}

          <div className="ai-avatar">

            <div className="ai-avatar__circle">

              AI

            </div>

          </div>

          {/* Question */}

          <div className="ai-question">

            <span>

              QUESTION{" "}
              {currentQuestionIndex + 1}

            </span>

            <h1>

              {currentQuestion.question}

            </h1>

          </div>

          {/* =================================================
              TEXT TO SPEECH
          ================================================= */}

          <TextToSpeechAI
            question={
              currentQuestion.question
            }
            autoSpeak={true}
          />

        </section>

        {/* =================================================
            CANDIDATE
        ================================================= */}

        <section className="candidate-panel">

          {/* =================================================
              CAMERA
          ================================================= */}

          <div className="candidate-camera">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            {!isCameraOn && (

              <div className="camera-placeholder">

                <div>
                  📹
                </div>

                <p>
                  Starting camera...
                </p>

              </div>

            )}

            <div className="camera-status">

              <span />

              Camera On

            </div>

          </div>

          {/* Camera Error */}

          {cameraError && (

            <div className="camera-error">

              {cameraError}

            </div>

          )}

          {/* =================================================
              ANSWER
          ================================================= */}

          <div className="candidate-answer">

            <div className="candidate-answer__header">

              <div>

                <h2>
                  Your Answer
                </h2>

                <p>
                  Choose how you want to respond.
                </p>

              </div>

            </div>

            {/* =================================================
                TYPE / SPEAK
            ================================================= */}

            <div className="answer-mode">

              {/* Type */}

              <button
                type="button"
                className={
                  answerMode === "type"
                    ? "answer-mode__button active"
                    : "answer-mode__button"
                }
                onClick={
                  handleTypeMode
                }
              >

                ⌨️ Type

              </button>

              {/* Speak */}

              <button
                type="button"
                className={
                  answerMode === "speak"
                    ? "answer-mode__button active"
                    : "answer-mode__button"
                }
                onClick={
                  handleSpeakMode
                }
              >

                🎙️ Speak

              </button>

            </div>

            {/* =================================================
                TYPE ANSWER
            ================================================= */}

            {answerMode === "type" && (

              <div className="type-answer">

                <textarea
                  value={answer}
                  onChange={(event) =>
                    handleAnswerChange(
                      event.target.value
                    )
                  }
                  placeholder="Type your answer here..."
                  rows={6}
                />

                <div className="answer-meta">

                  <span>

                    {answer.length}
                    {" "}characters

                  </span>

                </div>

              </div>

            )}

            {/* =================================================
                SPEAK ANSWER
            ================================================= */}

            {answerMode === "speak" && (

              <SpeechToText
                value={answer}
                onTranscriptChange={
                  handleAnswerChange
                }
                onListeningChange={
                  handleListeningChange
                }
              />

            )}

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="button"
              className="submit-answer"
              disabled={
                !answer.trim() ||
                isListening
              }
              onClick={
                handleSubmitAnswer
              }
            >

              Submit Answer

              <span>
                →
              </span>

            </button>

          </div>

        </section>

      </div>

    </main>

  );
}

export default InterviewPage;