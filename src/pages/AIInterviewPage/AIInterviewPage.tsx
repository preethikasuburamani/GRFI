import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import SpeechToText from "../../Components/InterviewParts/SpeechToText";
import TextToSpeechAI from "../../Components/InterviewParts/TextToSpeechAI";

import "./AIInterviewPage.css";

/* =========================================================
   Types
========================================================= */

interface InterviewQuestion {
  id: number;
  question: string;
}

interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

/* =========================================================
   OpenRouter Configuration
========================================================= */

const OPENROUTER_API_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_MODEL =
  "openai/gpt-5.2";

/*
 * Keep the output reasonably small.
 *
 * 900 tokens is enough for the JSON containing
 * interview questions and is less expensive than
 * requesting 2000 tokens.
 */
const MAX_OUTPUT_TOKENS = 900;

/* =========================================================
   AI Interview Page
========================================================= */

function AIInterviewPage() {

  const navigate = useNavigate();

  /* =======================================================
     Camera
  ======================================================= */

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const [
    isCameraOn,
    setIsCameraOn,
  ] = useState(false);

  const [
    cameraError,
    setCameraError,
  ] = useState("");

  /* =======================================================
     Question Generation Protection
  ======================================================= */

  /*
   * React StrictMode can run useEffect twice during
   * development.
   *
   * This ref prevents two OpenRouter requests from
   * being created for the same interview page.
   */
  const questionGenerationStarted =
    useRef(false);

  /* =======================================================
     Questions
  ======================================================= */

  const [
    questions,
    setQuestions,
  ] = useState<InterviewQuestion[]>([]);

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [
    isGeneratingQuestions,
    setIsGeneratingQuestions,
  ] = useState(true);

  const [
    questionError,
    setQuestionError,
  ] = useState("");

  /* =======================================================
     Answer
  ======================================================= */

  const [
    answerMode,
    setAnswerMode,
  ] = useState<"type" | "speak">("type");

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    isListening,
    setIsListening,
  ] = useState(false);

  /* =======================================================
     AI Speaking
  ======================================================= */

  const [
    isAISpeaking,
    setIsAISpeaking,
  ] = useState(false);

  /* =======================================================
     Interview State
  ======================================================= */

  const [
    isInterviewComplete,
    setIsInterviewComplete,
  ] = useState(false);

  /* =======================================================
     Current Question
  ======================================================= */

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  /* =========================================================
     Start Camera + Microphone
  ========================================================= */

  useEffect(() => {

    let mounted = true;

    const startMedia =
      async () => {

        try {

          setCameraError("");

          const stream =
            await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });

          /*
           * Component may have been removed while
           * browser permission dialog was open.
           */
          if (!mounted) {

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            return;
          }

          mediaStreamRef.current =
            stream;

          if (videoRef.current) {

            videoRef.current.srcObject =
              stream;

          }

          setIsCameraOn(true);

        } catch (error) {

          console.error(
            "Camera/microphone error:",
            error
          );

          setCameraError(
            "Camera and microphone permission is required for the interview."
          );

          setIsCameraOn(false);

        }

      };

    startMedia();

    return () => {

      mounted = false;

      if (
        mediaStreamRef.current
      ) {

        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        mediaStreamRef.current =
          null;

      }

    };

  }, []);

  /* =========================================================
     Generate Questions
  ========================================================= */

  useEffect(() => {

    /*
     * Prevent duplicate API requests.
     */
    if (
      questionGenerationStarted.current
    ) {

      return;

    }

    questionGenerationStarted.current =
      true;

    const generateQuestions =
      async () => {

        try {

          setIsGeneratingQuestions(true);
          setQuestionError("");

          /* ===============================================
             Get Interview Information
          =============================================== */

          const cvText =
            sessionStorage.getItem(
              "grfiCvText"
            );

          const jobInputType =
            sessionStorage.getItem(
              "grfiJobInputType"
            );

          const jobDescription =
            sessionStorage.getItem(
              "grfiJobDescription"
            ) || "";

          const role =
            sessionStorage.getItem(
              "grfiRole"
            ) || "";

          const interviewType =
            sessionStorage.getItem(
              "grfiInterviewType"
            ) || "mixed";

          const difficulty =
            sessionStorage.getItem(
              "grfiDifficulty"
            ) || "medium";

          const questionCount =
            Number(
              sessionStorage.getItem(
                "grfiQuestionCount"
              ) || "10"
            );

          /* ===============================================
             Validate CV
          =============================================== */

          if (!cvText) {

            throw new Error(
              "CV information is missing. Please return to the setup page and upload your CV again."
            );

          }

          /* ===============================================
             Determine Target Job
          =============================================== */

          const targetJob =
            jobInputType === "role"
              ? role
              : jobDescription;

          if (
            !targetJob.trim()
          ) {

            throw new Error(
              "No job description or target role was provided."
            );

          }

          /* ===============================================
             API Key
          =============================================== */

          const apiKey =
            import.meta.env
              .VITE_OPENROUTER_API_KEY;

          if (!apiKey) {

            throw new Error(
              "OpenRouter API key is missing. Please check your .env.local file."
            );

          }

          /* ===============================================
             Prompt
          =============================================== */

          const systemPrompt = `
You are an expert interviewer for GRFI
(Get Ready For Interview).

Create realistic interview questions based on
the candidate's CV and target job.

Rules:

1. Use information from the candidate's CV.
2. Make questions relevant to the target job.
3. Never invent experience, skills or projects.
4. Follow the requested interview type.
5. Follow the requested difficulty.
6. Avoid duplicate questions.
7. Make questions clear and conversational.
8. Return ONLY valid JSON.
9. Do not use markdown.
10. Do not add explanations.

Return exactly:

{
  "questions": [
    {
      "id": 1,
      "question": "Question text"
    }
  ]
}
`;

          const userPrompt = `
Candidate CV:

${cvText}

Target job or role:

${targetJob}

Interview type:

${interviewType}

Difficulty:

${difficulty}

Number of questions:

${questionCount}

Generate exactly ${questionCount} personalised interview questions.
`;

          /* ===============================================
             OpenRouter Request
          =============================================== */

          console.log(
            "Generating interview questions..."
          );

          const response =
            await fetch(
              OPENROUTER_API_URL,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${apiKey}`,

                  "HTTP-Referer":
                    window.location.origin,

                  "X-Title":
                    "GRFI - Get Ready For Interview",
                },

                body: JSON.stringify({

                  model:
                    OPENROUTER_MODEL,

                  messages: [

                    {
                      role: "system",
                      content:
                        systemPrompt,
                    },

                    {
                      role: "user",
                      content:
                        userPrompt,
                    },

                  ],

                  temperature: 0.5,

                  /*
                   * Reduced from 2000.
                   */
                  max_tokens:
                    MAX_OUTPUT_TOKENS,

                }),

              }
            );

          /* ===============================================
             API Error
          =============================================== */

          if (!response.ok) {

            const errorText =
              await response.text();

            console.error(
              "OpenRouter error:",
              errorText
            );

            /*
             * Specific credit error.
             */
            if (
              response.status === 402
            ) {

              throw new Error(
                "OpenRouter does not have enough available credits for this request. Please wait for any active requests to finish or add OpenRouter credits."
              );

            }

            if (
              response.status === 401
            ) {

              throw new Error(
                "OpenRouter API key is invalid or not authorised."
              );

            }

            if (
              response.status === 429
            ) {

              throw new Error(
                "OpenRouter rate limit reached. Please wait a moment and try again."
              );

            }

            throw new Error(
              `OpenRouter request failed (${response.status}).`
            );

          }

          /* ===============================================
             Read Response
          =============================================== */

          const data =
            (await response.json()) as OpenRouterResponse;

          const content =
            data.choices?.[0]
              ?.message
              ?.content;

          if (!content) {

            throw new Error(
              "OpenRouter returned an empty response."
            );

          }

          console.log(
            "OpenRouter response received."
          );

          /* ===============================================
             Clean JSON
          =============================================== */

          const cleanedContent =
            content
              .replace(
                /^```json\s*/i,
                ""
              )
              .replace(
                /^```\s*/i,
                ""
              )
              .replace(
                /\s*```$/i,
                ""
              )
              .trim();

          /* ===============================================
             Parse JSON
          =============================================== */

          let parsed: {
            questions?: InterviewQuestion[];
          };

          try {

            parsed =
              JSON.parse(
                cleanedContent
              ) as {
                questions?: InterviewQuestion[];
              };

          } catch (error) {

            console.error(
              "AI JSON parsing error:",
              error
            );

            console.error(
              "AI returned:",
              cleanedContent
            );

            throw new Error(
              "The AI returned an invalid question format. Please try starting the interview again."
            );

          }

          /* ===============================================
             Validate Questions
          =============================================== */

          if (
            !parsed.questions ||
            !Array.isArray(
              parsed.questions
            )
          ) {

            throw new Error(
              "AI returned an invalid question format."
            );

          }

          const validQuestions =
            parsed.questions
              .filter(
                (
                  item
                ) =>
                  typeof item.question ===
                    "string" &&
                  item.question.trim()
              )
              .map(
                (
                  item,
                  index
                ) => ({

                  id:
                    index + 1,

                  question:
                    item.question.trim(),

                })
              );

          if (
            validQuestions.length === 0
          ) {

            throw new Error(
              "No valid interview questions were generated."
            );

          }

          /* ===============================================
             Store Questions
          =============================================== */

          sessionStorage.setItem(
            "grfiQuestions",
            JSON.stringify(
              validQuestions
            )
          );

          setQuestions(
            validQuestions
          );

          setCurrentQuestionIndex(
            0
          );

        } catch (error) {

          console.error(
            "Question generation error:",
            error
          );

          setQuestionError(
            error instanceof Error
              ? error.message
              : "Unable to generate interview questions."
          );

        } finally {

          setIsGeneratingQuestions(
            false
          );

        }

      };

    generateQuestions();

  }, []);

  /* =========================================================
     AI Question Speech Started
  ========================================================= */

  const handleQuestionSpeechStart =
    () => {

      setIsAISpeaking(
        true
      );

    };

  /* =========================================================
     AI Question Speech Ended
  ========================================================= */

  const handleQuestionSpeechEnd =
    () => {

      setIsAISpeaking(
        false
      );

    };

  /* =========================================================
     Speech Transcript
  ========================================================= */

  const handleSpeechTranscript =
    (
      transcript: string
    ) => {

      setAnswer(
        transcript
      );

    };

  /* =========================================================
     Candidate Speech Started
  ========================================================= */

  const handleSpeechStart =
    () => {

      setIsListening(
        true
      );

    };

  /* =========================================================
     Candidate Speech Ended
  ========================================================= */

  const handleSpeechEnd =
    () => {

      setIsListening(
        false
      );

    };

  /* =========================================================
     Submit Answer
  ========================================================= */

  const handleSubmitAnswer =
    () => {

      if (
        !answer.trim()
      ) {

        return;

      }

      console.log(
        "Candidate answer:",
        answer
      );

      console.log(
        "Question:",
        currentQuestion?.question
      );

      /* ===============================================
         Last Question
      =============================================== */

      if (
        currentQuestionIndex >=
        questions.length - 1
      ) {

        setIsInterviewComplete(
          true
        );

        /*
         * Stop camera and microphone.
         */
        if (
          mediaStreamRef.current
        ) {

          mediaStreamRef.current
            .getTracks()
            .forEach(
              (track) =>
                track.stop()
            );

          mediaStreamRef.current =
            null;

          setIsCameraOn(
            false
          );

        }

        /*
         * Stop AI speech.
         */
        window.speechSynthesis.cancel();

        return;

      }

      /* ===============================================
         Next Question
      =============================================== */

      setCurrentQuestionIndex(
        (
          previous
        ) =>
          previous + 1
      );

      setAnswer("");

      setAnswerMode(
        "type"
      );

      setIsListening(
        false
      );

    };

  /* =========================================================
     End Interview
  ========================================================= */

  const handleEndInterview =
    () => {

      /*
       * Stop camera and microphone.
       */
      if (
        mediaStreamRef.current
      ) {

        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        mediaStreamRef.current =
          null;

      }

      /*
       * Stop AI speech.
       */
      window.speechSynthesis.cancel();

      setIsCameraOn(
        false
      );

      navigate(
        "/"
      );

    };

  /* =========================================================
     Loading Screen
  ========================================================= */

  if (
    isGeneratingQuestions
  ) {

    return (

      <main className="realtime-interview">

        <div className="interview-loading">

          <div className="interview-loading__spinner">
            AI
          </div>

          <h1>
            Preparing your interview...
          </h1>

          <p>
            GRFI is analysing your CV and
            preparing personalised questions.
          </p>

        </div>

      </main>

    );

  }

  /* =========================================================
     Error Screen
  ========================================================= */

  if (
    questionError
  ) {

    return (

      <main className="realtime-interview">

        <div className="interview-error">

          <div className="interview-error__icon">
            !
          </div>

          <h1>
            We couldn't start your interview
          </h1>

          <p>
            {questionError}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/interviewSetUp"
              )
            }
          >
            Back to Setup
          </button>

        </div>

      </main>

    );

  }

  /* =========================================================
     Interview Complete
  ========================================================= */

  if (
    isInterviewComplete
  ) {

    return (

      <main className="realtime-interview">

        <div className="interview-complete">

          <div className="interview-complete__icon">
            ✓
          </div>

          <h1>
            Interview Complete
          </h1>

          <p>
            Great work. You've completed all{" "}
            {questions.length} questions.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/"
              )
            }
          >
            Finish
          </button>

        </div>

      </main>

    );

  }

  /* =========================================================
     Main Interview
  ========================================================= */

  return (

    <main className="realtime-interview">

      {/* =====================================================
          Header
      ===================================================== */}

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

          {questions.length}

        </div>

        <button
          type="button"
          className="realtime-interview__exit"
          onClick={
            handleEndInterview
          }
        >
          End Interview
        </button>

      </header>

      {/* =====================================================
          Main Content
      ===================================================== */}

      <div className="realtime-interview__content">

        {/* ===================================================
            AI Interviewer
        =================================================== */}

        <section className="ai-interviewer">

          <div className="ai-interviewer__top">

            <span className="ai-interviewer__status">

              <span>
                ●
              </span>

              AI Interviewer

            </span>

            <span className="ai-interviewer__speaking">

              {isAISpeaking
                ? "🔊 Speaking..."
                : "🔊 Ready"}

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

              {currentQuestion?.question}

            </h1>

          </div>

          {/* =================================================
              Text To Speech
          ================================================= */}

          {currentQuestion && (

            <TextToSpeechAI
              text={
                currentQuestion.question
              }
              onStart={
                handleQuestionSpeechStart
              }
              onEnd={
                handleQuestionSpeechEnd
              }
            />

          )}

        </section>

        {/* ===================================================
            Candidate Panel
        =================================================== */}

        <section className="candidate-panel">

          {/* =================================================
              Camera
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

            {isCameraOn && (

              <div className="camera-status">

                <span />

                Camera On

              </div>

            )}

          </div>

          {cameraError && (

            <div className="camera-error">

              {cameraError}

            </div>

          )}

          {/* =================================================
              Candidate Answer
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
                Answer Modes
            ================================================= */}

            <div className="answer-mode">

              <button
                type="button"
                className={
                  answerMode === "type"
                    ? "answer-mode__button active"
                    : "answer-mode__button"
                }
                onClick={() => {

                  setAnswerMode(
                    "type"
                  );

                  setIsListening(
                    false
                  );

                }}
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
                  setAnswerMode(
                    "speak"
                  )
                }
              >

                🎙️ Speak

              </button>

            </div>

            {/* =================================================
                Type Answer
            ================================================= */}

            {answerMode === "type" && (

              <div className="type-answer">

                <textarea
                  value={
                    answer
                  }
                  onChange={(
                    event
                  ) =>
                    setAnswer(
                      event.target.value
                    )
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

            {/* =================================================
                Speak Answer
            ================================================= */}

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

                  Speak naturally. Your answer
                  will appear as text here.

                </p>

                {/* =============================================
                    Speech To Text
                ============================================= */}

                <SpeechToText
                  onTranscript={
                    handleSpeechTranscript
                  }
                  onStart={
                    handleSpeechStart
                  }
                  onEnd={
                    handleSpeechEnd
                  }
                />

                <div className="speech-transcript">

                  {answer ||
                    "Your speech transcript will appear here..."}

                </div>

              </div>

            )}

            {/* =================================================
                Submit
            ================================================= */}

            <button
              type="button"
              className="submit-answer"
              disabled={
                !answer.trim()
              }
              onClick={
                handleSubmitAnswer
              }
            >

              {currentQuestionIndex ===
                questions.length - 1
                ? "Finish Interview"
                : "Submit Answer"}

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

export default AIInterviewPage;