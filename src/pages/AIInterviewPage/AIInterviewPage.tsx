
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

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

interface InterviewEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  betterAnswer: string;
}

interface InterviewAnswer {
  questionId: number;
  question: string;
  answer: string;
  evaluation: InterviewEvaluation;
}

/* =========================================================
   Gemini Configuration
========================================================= */

const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL ||
  "gemini-2.5-flash";

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY;

/*
 * Question generation needs enough tokens for
 * multiple complete questions.
 *
 * 900 was too small in your previous version.
 */
const QUESTION_MAX_OUTPUT_TOKENS = 1800;

/*
 * Evaluation responses are much smaller.
 */
const EVALUATION_MAX_OUTPUT_TOKENS = 800;

/* =========================================================
   Gemini API Helper
========================================================= */

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number
): Promise<string> {

  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is missing. Please check your .env.local file."
    );
  }

  const GEMINI_API_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(
    GEMINI_API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },

        contents: [
          {
            role: "user",

            parts: [
              {
                text: userPrompt,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.4,

          maxOutputTokens:
            maxOutputTokens,

          responseMimeType:
            "application/json",
        },
      }),
    }
  );

  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Gemini API error:",
      errorText
    );

    if (response.status === 429) {
      throw new Error(
        "Gemini rate limit reached. Please wait a moment and try again."
      );
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        "Gemini API key is invalid or not authorised."
      );
    }

    throw new Error(
      `Gemini request failed (${response.status}).`
    );
  }

  const data =
    (await response.json()) as GeminiResponse;

  const content =
    data.candidates?.[0]
      ?.content
      ?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

  if (!content) {
    console.error(
      "Gemini returned:",
      data
    );

    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return content;
}

/* =========================================================
   Clean Gemini JSON
========================================================= */

function cleanGeminiJson(
  content: string
): string {

  let cleaned =
    content.trim();

  /*
   * Remove markdown code fences if Gemini
   * adds them despite being asked for JSON.
   */

  cleaned =
    cleaned.replace(
      /^```json\s*/i,
      ""
    );

  cleaned =
    cleaned.replace(
      /^```\s*/i,
      ""
    );

  cleaned =
    cleaned.replace(
      /\s*```$/i,
      ""
    );

  return cleaned.trim();
}

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
     6C - Evaluation
  ======================================================= */

  const [
    isEvaluating,
    setIsEvaluating,
  ] = useState(false);

  const [
    evaluationError,
    setEvaluationError,
  ] = useState("");

  const [
    currentEvaluation,
    setCurrentEvaluation,
  ] = useState<InterviewEvaluation | null>(
    null
  );

  const [
    interviewAnswers,
    setInterviewAnswers,
  ] = useState<InterviewAnswer[]>([]);

  /* =======================================================
     Interview Complete
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
           * permission dialog was open.
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
     Generate Questions with Gemini
  ========================================================= */

  useEffect(() => {

    /*
     * Prevent duplicate Gemini requests.
     *
     * React StrictMode can run effects twice
     * during development.
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

          if (!cvText?.trim()) {

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
             Prompt
          =============================================== */

          const systemPrompt = `
You are an expert interviewer for GRFI
(Get Ready For Interview).

Generate personalised interview questions
for the candidate.

Use:

- The candidate's actual CV
- Their technical skills
- Their projects
- Their experience
- The target job or role
- Interview type
- Difficulty

Rules:

1. Never invent experience, skills or projects.
2. Make questions relevant to the target role.
3. Make questions relevant to the candidate's CV.
4. Follow the requested interview type.
5. Follow the requested difficulty.
6. Avoid duplicate questions.
7. Make questions clear and conversational.
8. Prefer practical and scenario-based questions where appropriate.
9. Return ONLY valid JSON.
10. Do not use markdown.
11. Do not add explanations.

Return exactly this structure:

{
  "questions": [
    {
      "id": 1,
      "question": "Question text"
    }
  ]
}

Generate exactly the requested number of questions.
`;

          const userPrompt = `
Candidate CV:

${cvText}


Target Job or Role:

${targetJob}


Interview Type:

${interviewType}


Difficulty:

${difficulty}


Number of Questions:

${questionCount}


Generate exactly ${questionCount} personalised interview questions.
`;

          console.log(
            "Generating interview questions with Gemini..."
          );

          /* ===============================================
             Gemini Request
          =============================================== */

          const content =
            await callGemini(
              systemPrompt,
              userPrompt,
              QUESTION_MAX_OUTPUT_TOKENS
            );

          console.log(
            "Gemini question response:",
            content
          );

          /* ===============================================
             Clean JSON
          =============================================== */

          const cleanedContent =
            cleanGeminiJson(
              content
            );

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

            /*
             * This usually means Gemini stopped
             * before completing the JSON response.
             */

            throw new Error(
              "Gemini returned an incomplete question response. Please try starting the interview again."
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
              "Gemini returned an invalid question format."
            );
          }

          const validQuestions =
            parsed.questions
              .filter(
                (item) =>
                  item &&
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

          /*
           * If Gemini returns fewer questions than requested,
           * tell the user rather than silently pretending
           * the interview has the requested number.
           */

          if (
            validQuestions.length <
            questionCount
          ) {

            console.warn(
              `Gemini generated ${validQuestions.length} questions instead of ${questionCount}.`
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

          /*
           * Clear any previous interview evaluations.
           *
           * This prevents an old interview's answers
           * appearing in the new interview.
           */

          sessionStorage.removeItem(
            "grfiInterviewAnswers"
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
     Stop Media
  ========================================================= */

  const stopMedia =
    () => {

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

      setIsCameraOn(
        false
      );

      window.speechSynthesis.cancel();
    };

  /* =========================================================
     6C - Evaluate Candidate Answer
  ========================================================= */

  const evaluateAnswer =
    async () => {

      if (
        !currentQuestion
      ) {

        return;
      }

      const trimmedAnswer =
        answer.trim();

      if (
        !trimmedAnswer
      ) {

        return;
      }

      try {

        setIsEvaluating(
          true
        );

        setEvaluationError("");

        setCurrentEvaluation(
          null
        );

        const interviewType =
          sessionStorage.getItem(
            "grfiInterviewType"
          ) || "mixed";

        const difficulty =
          sessionStorage.getItem(
            "grfiDifficulty"
          ) || "medium";

        const jobInputType =
          sessionStorage.getItem(
            "grfiJobInputType"
          );

        const role =
          sessionStorage.getItem(
            "grfiRole"
          ) || "";

        
        const targetRole =
          jobInputType === "role"
            ? role
            : "the role described in the job description";

        /* ===============================================
           Evaluation System Prompt
        =============================================== */

        const systemPrompt = `
You are an experienced professional interviewer
evaluating a candidate's answer.

Evaluate the candidate fairly.

Consider:

- Relevance
- Technical accuracy
- Understanding
- Depth
- Practical experience
- Problem solving
- Communication
- Completeness

Important:

1. Do not invent facts about the candidate.
2. Do not give credit for information that was not provided.
3. Do not penalise grammar heavily.
4. Do not evaluate accent.
5. Focus on the content of the answer.
6. Give a realistic score from 1 to 10.
7. Be specific and constructive.
8. Return ONLY valid JSON.
9. Do not use markdown.

Return exactly:

{
  "score": 8,
  "strengths": [
    "Strength 1",
    "Strength 2"
  ],
  "improvements": [
    "Improvement 1",
    "Improvement 2"
  ],
  "betterAnswer": "Example of a stronger answer."
}

The betterAnswer should be concise,
realistic and relevant to the question.
`;

        /* ===============================================
           Evaluation User Prompt
        =============================================== */

        const userPrompt = `
Target Role:

${targetRole}


Interview Type:

${interviewType}


Difficulty:

${difficulty}


Interview Question:

${currentQuestion.question}


Candidate Answer:

${trimmedAnswer}


Evaluate this candidate answer.
`;

        console.log(
          "Evaluating candidate answer with Gemini..."
        );

        /* ===============================================
           Gemini Evaluation Request
        =============================================== */

        const content =
          await callGemini(
            systemPrompt,
            userPrompt,
            EVALUATION_MAX_OUTPUT_TOKENS
          );

        console.log(
          "Gemini evaluation response:",
          content
        );

        /* ===============================================
           Clean JSON
        =============================================== */

        const cleanedContent =
          cleanGeminiJson(
            content
          );

        /* ===============================================
           Parse Evaluation
        =============================================== */

        let evaluation:
          InterviewEvaluation;

        try {

          evaluation =
            JSON.parse(
              cleanedContent
            ) as InterviewEvaluation;

        } catch (error) {

          console.error(
            "Evaluation JSON parsing error:",
            error
          );

          console.error(
            "Gemini returned:",
            cleanedContent
          );

          throw new Error(
            "Gemini returned an incomplete evaluation. Please try submitting your answer again."
          );
        }

        /* ===============================================
           Validate Evaluation
        =============================================== */

        if (
          typeof evaluation.score !==
            "number" ||
          !Array.isArray(
            evaluation.strengths
          ) ||
          !Array.isArray(
            evaluation.improvements
          ) ||
          typeof evaluation.betterAnswer !==
            "string"
        ) {

          throw new Error(
            "Gemini returned an invalid evaluation format."
          );
        }

        /*
         * Keep score safely between 1 and 10.
         */

        const safeScore =
          Math.min(
            10,
            Math.max(
              1,
              Math.round(
                evaluation.score
              )
            )
          );

        const finalEvaluation:
          InterviewEvaluation = {
            score:
              safeScore,

            strengths:
              evaluation.strengths
                .filter(
                  (
                    item
                  ) =>
                    typeof item ===
                    "string"
                )
                .map(
                  (
                    item
                  ) =>
                    item.trim()
                )
                .filter(
                  (
                    item
                  ) =>
                    item.length > 0
                ),

            improvements:
              evaluation.improvements
                .filter(
                  (
                    item
                  ) =>
                    typeof item ===
                    "string"
                )
                .map(
                  (
                    item
                  ) =>
                    item.trim()
                )
                .filter(
                  (
                    item
                  ) =>
                    item.length > 0
                ),

            betterAnswer:
              evaluation.betterAnswer.trim(),
          };

        /* ===============================================
           Store Current Evaluation
        =============================================== */

        setCurrentEvaluation(
          finalEvaluation
        );

        /* ===============================================
           Store Complete Answer Record
        =============================================== */

        const answerRecord:
          InterviewAnswer = {
            questionId:
              currentQuestion.id,

            question:
              currentQuestion.question,

            answer:
              trimmedAnswer,

            evaluation:
              finalEvaluation,
          };

        setInterviewAnswers(
          (previousAnswers) => {

            /*
             * Prevent duplicate records if
             * the user somehow submits twice.
             */

            const filteredAnswers =
              previousAnswers.filter(
                (item) =>
                  item.questionId !==
                  currentQuestion.id
              );

            const updatedAnswers = [
              ...filteredAnswers,
              answerRecord,
            ];

            sessionStorage.setItem(
              "grfiInterviewAnswers",
              JSON.stringify(
                updatedAnswers
              )
            );

            return updatedAnswers;
          }
        );

      } catch (error) {

        console.error(
          "Answer evaluation error:",
          error
        );

        setEvaluationError(
          error instanceof Error
            ? error.message
            : "Unable to evaluate your answer."
        );

      } finally {

        setIsEvaluating(
          false
        );
      }
    };

  /* =========================================================
     Next Question
  ========================================================= */

  const handleNextQuestion =
    () => {

      if (
        !currentEvaluation
      ) {

        return;
      }

      const isLastQuestion =
        currentQuestionIndex >=
        questions.length - 1;

      /* ===============================================
         Last Question
      =============================================== */

      if (
        isLastQuestion
      ) {

        setIsInterviewComplete(
          true
        );

        stopMedia();

        console.log(
          "Interview completed:",
          interviewAnswers
        );

        return;
      }

      /* ===============================================
         Next Question
      =============================================== */

      setCurrentQuestionIndex(
        (previous) =>
          previous + 1
      );

      setAnswer("");

      setAnswerMode(
        "type"
      );

      setIsListening(
        false
      );

      setCurrentEvaluation(
        null
      );

      setEvaluationError("");

    };

  /* =========================================================
     End Interview
  ========================================================= */

  const handleEndInterview =
    () => {

      stopMedia();

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

          {/* Text To Speech */}

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

            {!currentEvaluation && (

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
                  disabled={
                    isEvaluating
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
                    setAnswerMode(
                      "speak"
                    )
                  }
                  disabled={
                    isEvaluating
                  }
                >
                  🎙️ Speak
                </button>

              </div>

            )}

            {/* =================================================
                Type Answer
            ================================================= */}

            {answerMode === "type" &&
              !currentEvaluation && (

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
                  disabled={
                    isEvaluating
                  }
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

            {answerMode === "speak" &&
              !currentEvaluation && (

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

                {/* Speech To Text */}

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
                Evaluation Error
            ================================================= */}

            {evaluationError && (

              <div className="evaluation-error">

                {evaluationError}

              </div>

            )}

            {/* =================================================
                Evaluation Loading
            ================================================= */}

            {isEvaluating && (

              <div className="evaluation-loading">

                <div>
                  AI
                </div>

                <p>
                  Evaluating your answer...
                </p>

              </div>

            )}

            {/* =================================================
                6C - Evaluation Result
            ================================================= */}

            {currentEvaluation && (

              <div className="evaluation-result">

                {/* Evaluation Header */}

                <div className="evaluation-result__header">

                  <div>

                    <span>
                      AI Evaluation
                    </span>

                    <h2>
                      Your answer has been evaluated
                    </h2>

                  </div>

                  <div className="evaluation-score">

                    <strong>
                      {currentEvaluation.score}
                    </strong>

                    <span>
                      /10
                    </span>

                  </div>

                </div>

                {/* Strengths */}

                <div className="evaluation-section">

                  <h3>
                    What you did well
                  </h3>

                  <ul>

                    {currentEvaluation.strengths.map(
                      (
                        strength,
                        index
                      ) => (

                        <li
                          key={index}
                        >
                          {strength}
                        </li>

                      )
                    )}

                  </ul>

                </div>

                {/* Improvements */}

                <div className="evaluation-section">

                  <h3>
                    What you can improve
                  </h3>

                  <ul>

                    {currentEvaluation.improvements.map(
                      (
                        improvement,
                        index
                      ) => (

                        <li
                          key={index}
                        >
                          {improvement}
                        </li>

                      )
                    )}

                  </ul>

                </div>

                {/* Better Answer */}

                <div className="evaluation-section">

                  <h3>
                    Example of a stronger answer
                  </h3>

                  <p>
                    {currentEvaluation.betterAnswer}
                  </p>

                </div>

              </div>

            )}

            {/* =================================================
                Submit Answer
            ================================================= */}

            {!currentEvaluation && (

              <button
                type="button"
                className="submit-answer"
                disabled={
                  !answer.trim() ||
                  isEvaluating
                }
                onClick={
                  evaluateAnswer
                }
              >

                {isEvaluating
                  ? "Evaluating..."
                  : "Submit Answer"}

                <span>
                  →
                </span>

              </button>

            )}

            {/* =================================================
                Next Question
            ================================================= */}

            {currentEvaluation && (

              <button
                type="button"
                className="submit-answer"
                onClick={
                  handleNextQuestion
                }
              >

                {currentQuestionIndex ===
                questions.length - 1
                  ? "Finish Interview"
                  : "Next Question"}

                <span>
                  →
                </span>

              </button>

            )}

          </div>

        </section>

      </div>

    </main>

  );
}

export default AIInterviewPage;