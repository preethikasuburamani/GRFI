import { useEffect, useRef, useState } from "react";
import "./AIInterviewPage.css";

interface InterviewQuestion {
  id: number;
  question: string;
}

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

function InterviewPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [cameraError, setCameraError] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [answerMode, setAnswerMode] =
    useState<"type" | "speak">("type");

  const [answer, setAnswer] = useState("");

  const [isListening, setIsListening] =
    useState(false);

  const currentQuestion =
    mockQuestions[currentQuestionIndex];

  /*
   * Start camera and microphone
   */
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setIsCameraOn(true);
      } catch (error) {
        console.error(error);

        setCameraError(
          "Camera and microphone permission is required for the interview."
        );
      }
    };

    startMedia();

    /*
     * Stop camera and microphone
     * when leaving the page.
     */
    return () => {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;

    console.log("Candidate answer:", answer);

    if (
      currentQuestionIndex <
      mockQuestions.length - 1
    ) {
      setCurrentQuestionIndex(
        (previous) => previous + 1
      );

      setAnswer("");
      setAnswerMode("type");
    } else {
      console.log("Interview completed");
    }
  };

  const handleStartSpeaking = () => {
    setIsListening(true);

    /*
     * Speech recognition will be added next.
     */
  };

  const handleStopSpeaking = () => {
    setIsListening(false);
  };

  return (
    <main className="realtime-interview">

      {/* Header */}

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
          {currentQuestionIndex + 1} of{" "}
          {mockQuestions.length}
        </div>

        <button
          type="button"
          className="realtime-interview__exit"
        >
          End Interview
        </button>

      </header>

      {/* Main layout */}

      <div className="realtime-interview__content">

        {/* Left - AI interviewer */}

        <section className="ai-interviewer">

          <div className="ai-interviewer__top">

            <span className="ai-interviewer__status">
              ● AI Interviewer
            </span>

            <span className="ai-interviewer__speaking">
              🔊 Ready
            </span>

          </div>

          <div className="ai-avatar">
            <div className="ai-avatar__circle">
              AI
            </div>
          </div>

          <div className="ai-question">

            <span>
              QUESTION {currentQuestionIndex + 1}
            </span>

            <h1>
              {currentQuestion.question}
            </h1>

          </div>

          <div className="ai-audio-status">
            <span>🔊</span>

            <div className="audio-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

            <span>
              AI interviewer
            </span>
          </div>

        </section>

        {/* Right - Candidate */}

        <section className="candidate-panel">

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

          {cameraError && (
            <div className="camera-error">
              {cameraError}
            </div>
          )}

          {/* Answer */}

          <div className="candidate-answer">

            <div className="candidate-answer__header">

              <div>
                <h2>Your Answer</h2>

                <p>
                  Choose how you want to respond.
                </p>
              </div>

            </div>

            {/* Mode buttons */}

            <div className="answer-mode">

              <button
                type="button"
                className={
                  answerMode === "type"
                    ? "answer-mode__button active"
                    : "answer-mode__button"
                }
                onClick={() =>
                  setAnswerMode("type")
                }
              >
                ⌨️ Type
              </button>

              <button
                type="button"
                className={
                  answerMode === "speak"
                    ? "answer-mode__button active"
                    : "answer-mode__button"
                }
                onClick={() =>
                  setAnswerMode("speak")
                }
              >
                🎙️ Speak
              </button>

            </div>

            {/* Typing */}

            {answerMode === "type" && (
              <div className="type-answer">

                <textarea
                  value={answer}
                  onChange={(event) =>
                    setAnswer(event.target.value)
                  }
                  placeholder="Type your answer here..."
                  rows={6}
                />

                <div className="answer-meta">
                  <span>
                    {answer.length} characters
                  </span>
                </div>

              </div>
            )}

            {/* Speaking */}

            {answerMode === "speak" && (
              <div className="speak-answer">

                <div
                  className={
                    isListening
                      ? "microphone-button listening"
                      : "microphone-button"
                  }
                >
                  🎙️
                </div>

                <h3>
                  {isListening
                    ? "Listening..."
                    : "Ready when you are"}
                </h3>

                <p>
                  Speak naturally. Your answer will
                  appear as text here.
                </p>

                <button
                  type="button"
                  className="speak-button"
                  onClick={
                    isListening
                      ? handleStopSpeaking
                      : handleStartSpeaking
                  }
                >
                  {isListening
                    ? "Stop Speaking"
                    : "Start Speaking"}
                </button>

                <div className="speech-transcript">
                  {answer ||
                    "Your speech transcript will appear here..."}
                </div>

              </div>
            )}

            {/* Submit */}

            <button
              type="button"
              className="submit-answer"
              disabled={!answer.trim()}
              onClick={handleSubmitAnswer}
            >
              Submit Answer
              <span>→</span>
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}

export default InterviewPage;