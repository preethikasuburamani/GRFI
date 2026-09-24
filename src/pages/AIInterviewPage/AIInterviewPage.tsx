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
   TYPES
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

interface InterviewAnswer {
  questionId: number;
  question: string;
  answer: string;
}

interface QuestionFeedback {
  questionId: number;
  score: number;
  strengths: string[];
  improvements: string[];
  betterAnswer: string;
}

interface InterviewAnalysis {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  questionFeedback: QuestionFeedback[];
}

/* =========================================================
   GEMINI CONFIGURATION
========================================================= */

const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL ||
  "gemini-2.5-flash";

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY;

const QUESTION_MAX_OUTPUT_TOKENS = 3000;

const ANALYSIS_MAX_OUTPUT_TOKENS = 5000;

/* =========================================================
   GEMINI API HELPER
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
      ?.map(
        (part) =>
          part.text || ""
      )
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
   CLEAN GEMINI JSON
========================================================= */

function cleanGeminiJson(
  content: string
): string {

  let cleaned =
    content.trim();

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
   AI INTERVIEW PAGE
========================================================= */

function AIInterviewPage() {

  const navigate =
    useNavigate();

  /* =======================================================
     CAMERA
  ======================================================= */

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const mediaStreamRef =
    useRef<MediaStream | null>(
      null
    );

  const [
    isCameraOn,
    setIsCameraOn,
  ] = useState(false);

  const [
    cameraError,
    setCameraError,
  ] = useState("");

  /* =======================================================
     QUESTION GENERATION
  ======================================================= */

  const questionGenerationStarted =
    useRef(false);

  const [
    questions,
    setQuestions,
  ] = useState<
    InterviewQuestion[]
  >([]);

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
     ANSWER
  ======================================================= */

  const [
    answerMode,
    setAnswerMode,
  ] = useState<
    "type" | "speak"
  >("type");

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    isListening,
    setIsListening,
  ] = useState(false);

  /* =======================================================
     AI SPEAKING
  ======================================================= */

  const [
    isAISpeaking,
    setIsAISpeaking,
  ] = useState(false);

  /* =======================================================
     COLLECTED ANSWERS
  ======================================================= */

  const [
    interviewAnswers,
    setInterviewAnswers,
  ] = useState<
    InterviewAnswer[]
  >([]);

  /* =======================================================
     FINAL ANALYSIS
  ======================================================= */

  const [
    isAnalyzingInterview,
    setIsAnalyzingInterview,
  ] = useState(false);

  const [
    analysisError,
    setAnalysisError,
  ] = useState("");

  /* =======================================================
     INTERVIEW COMPLETE
  ======================================================= */

  const [
    isInterviewComplete,
    setIsInterviewComplete,
  ] = useState(false);

  /* =======================================================
     CURRENT QUESTION
  ======================================================= */

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  /* =========================================================
     START CAMERA + MICROPHONE
  ========================================================= */

  useEffect(() => {

    let mounted = true;

    const startMedia =
      async () => {

        try {

          setCameraError("");

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: true,
                audio: true,
              }
            );

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
     GENERATE QUESTIONS
     
     GEMINI CALL #1
     
     This is the ONLY AI call before the interview ends.
  ========================================================= */

  useEffect(() => {

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

          setIsGeneratingQuestions(
            true
          );

          setQuestionError("");

          /* ===============================================
             GET INTERVIEW INFORMATION
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
             VALIDATE CV
          =============================================== */

          if (
            !cvText?.trim()
          ) {

            throw new Error(
              "CV information is missing. Please return to the setup page and upload your CV again."
            );
          }

          /* ===============================================
             TARGET JOB
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
             SYSTEM PROMPT
          =============================================== */

          const systemPrompt = `
You are GRFI, an AI interview coach.

Create personalised interview questions
for a candidate.

Use the candidate's CV and target job
to create realistic questions.

Consider:

- Candidate experience
- Candidate projects
- Candidate technical skills
- Candidate responsibilities
- Target role
- Job description
- Interview type
- Difficulty

Rules:

1. Never invent candidate experience.
2. Never invent candidate projects.
3. Never invent candidate skills.
4. Questions must be relevant to the target role.
5. Questions should feel like real interview questions.
6. Avoid duplicate questions.
7. Use a mixture of technical, behavioural,
   practical and scenario questions when
   interview type is mixed.
8. Keep questions clear and conversational.
9. Return ONLY valid JSON.
10. Do not use markdown.
11. Do not include explanations.

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

          /* ===============================================
             USER PROMPT
          =============================================== */

          const userPrompt = `
Candidate CV:

----------------
${cvText}
----------------


Target Job / Role:

----------------
${targetJob}
----------------


Interview Type:

${interviewType}


Difficulty:

${difficulty}


Number of Questions:

${questionCount}


Generate exactly ${questionCount}
personalised interview questions.
`;

          console.log(
            "Generating interview questions with Gemini..."
          );

          /* ===============================================
             GEMINI REQUEST
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
             CLEAN JSON
          =============================================== */

          const cleanedContent =
            cleanGeminiJson(
              content
            );

          /* ===============================================
             PARSE JSON
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
              "Gemini returned an incomplete question response. Please try starting the interview again."
            );
          }

          /* ===============================================
             VALIDATE QUESTIONS
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
                (
                  item
                ): item is InterviewQuestion =>
                  Boolean(item) &&
                  typeof item.question ===
                    "string" &&
                  item.question.trim()
                    .length > 0
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

          if (
            validQuestions.length <
            questionCount
          ) {

            console.warn(
              `Gemini generated ${validQuestions.length} questions instead of ${questionCount}.`
            );
          }

          /* ===============================================
             SAVE QUESTIONS
          =============================================== */

          sessionStorage.setItem(
            "grfiQuestions",
            JSON.stringify(
              validQuestions
            )
          );

          /* ===============================================
             START FRESH INTERVIEW
          =============================================== */

          sessionStorage.removeItem(
            "grfiInterviewAnswers"
          );

          sessionStorage.removeItem(
            "grfiInterviewAnalysis"
          );

          setInterviewAnswers(
            []
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
     AI QUESTION SPEECH
  ========================================================= */

  const handleQuestionSpeechStart =
    () => {

      setIsAISpeaking(
        true
      );
    };

  const handleQuestionSpeechEnd =
    () => {

      setIsAISpeaking(
        false
      );
    };

  /* =========================================================
     SPEECH TRANSCRIPT
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
     SPEECH START
  ========================================================= */

  const handleSpeechStart =
    () => {

      setIsListening(
        true
      );
    };

  /* =========================================================
     SPEECH END
  ========================================================= */

  const handleSpeechEnd =
    () => {

      setIsListening(
        false
      );
    };

  /* =========================================================
     STOP MEDIA
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
     FINAL INTERVIEW ANALYSIS
     
     GEMINI CALL #2
     
     This happens ONLY after every question is answered.
  ========================================================= */

  const analyseCompleteInterview =
    async (
      allAnswers: InterviewAnswer[]
    ) => {

      if (
        allAnswers.length === 0
      ) {

        throw new Error(
          "No interview answers were collected."
        );
      }

      const cvText =
        sessionStorage.getItem(
          "grfiCvText"
        ) || "";

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

      const targetJob =
        jobInputType === "role"
          ? role
          : jobDescription;

      /* ===============================================
         CREATE COMPLETE Q&A
      =============================================== */

      const interviewTranscript =
        allAnswers
          .map(
            (
              item,
              index
            ) => `
QUESTION ${index + 1}:

${item.question}

CANDIDATE ANSWER:

${item.answer}
`
          )
          .join("\n\n");

      /* ===============================================
         SYSTEM PROMPT
      =============================================== */

      const systemPrompt = `
You are the final AI interview evaluator
for GRFI.

The candidate has completed the entire
interview.

You must analyse the COMPLETE interview,
not individual answers separately.

Evaluate:

- Overall interview performance
- Technical understanding
- Problem solving
- Communication
- Relevance
- Practical experience
- Depth of answers
- Completeness
- Confidence based ONLY on the content
  of the answer
- How well the answers match the target role

Important rules:

1. Evaluate the complete interview.
2. Consider patterns across all answers.
3. Do not invent candidate experience.
4. Do not invent candidate skills.
5. Do not evaluate accent.
6. Do not heavily penalise grammar.
7. Be realistic and constructive.
8. Give an overall score from 1 to 10.
9. Give strengths across the complete interview.
10. Give improvement areas across the complete interview.
11. Give feedback for every question.
12. Give a better example answer for every question.
13. Keep better answers realistic for this candidate.
14. Return ONLY valid JSON.
15. Do not use markdown.

Return exactly:

{
  "overallScore": 7,
  "summary": "Overall interview summary.",
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "improvements": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3"
  ],
  "questionFeedback": [
    {
      "questionId": 1,
      "score": 7,
      "strengths": [
        "What was good"
      ],
      "improvements": [
        "What could improve"
      ],
      "betterAnswer": "A stronger realistic answer."
    }
  ]
}
`;

      /* ===============================================
         USER PROMPT
      =============================================== */

      const userPrompt = `
CANDIDATE CV:

----------------
${cvText}
----------------


TARGET JOB / ROLE:

----------------
${targetJob}
----------------


INTERVIEW TYPE:

${interviewType}


DIFFICULTY:

${difficulty}


COMPLETE INTERVIEW:

==============================

${interviewTranscript}

==============================

Analyse the candidate's complete interview.

There are ${allAnswers.length} answered questions.

Return feedback for all ${allAnswers.length} questions.
`;

      console.log(
        "Sending complete interview to Gemini for final analysis..."
      );

      /* ===============================================
         GEMINI REQUEST
      =============================================== */

      const content =
        await callGemini(
          systemPrompt,
          userPrompt,
          ANALYSIS_MAX_OUTPUT_TOKENS
        );

      console.log(
        "Gemini final analysis:",
        content
      );

      /* ===============================================
         CLEAN JSON
      =============================================== */

      const cleanedContent =
        cleanGeminiJson(
          content
        );

      /* ===============================================
         PARSE ANALYSIS
      =============================================== */

      let analysis:
        InterviewAnalysis;

      try {

        analysis =
          JSON.parse(
            cleanedContent
          ) as InterviewAnalysis;

      } catch (error) {

        console.error(
          "Final analysis JSON error:",
          error
        );

        console.error(
          "Gemini returned:",
          cleanedContent
        );

        throw new Error(
          "Gemini returned an incomplete interview analysis. Please try again."
        );
      }

      /* ===============================================
         VALIDATE ANALYSIS
      =============================================== */

      if (
        typeof analysis.overallScore !==
          "number" ||
        typeof analysis.summary !==
          "string" ||
        !Array.isArray(
          analysis.strengths
        ) ||
        !Array.isArray(
          analysis.improvements
        ) ||
        !Array.isArray(
          analysis.questionFeedback
        )
      ) {

        throw new Error(
          "Gemini returned an invalid interview analysis."
        );
      }

      /* ===============================================
         SAFE OVERALL SCORE
      =============================================== */

      const safeOverallScore =
        Math.min(
          10,
          Math.max(
            1,
            Math.round(
              analysis.overallScore
            )
          )
        );

      /* ===============================================
         SAFE QUESTION FEEDBACK
      =============================================== */

      const safeQuestionFeedback =
        analysis.questionFeedback
          .filter(
            (item) =>
              item &&
              typeof item.questionId ===
                "number" &&
              typeof item.score ===
                "number" &&
              Array.isArray(
                item.strengths
              ) &&
              Array.isArray(
                item.improvements
              ) &&
              typeof item.betterAnswer ===
                "string"
          )
          .map(
            (item) => ({
              questionId:
                item.questionId,

              score:
                Math.min(
                  10,
                  Math.max(
                    1,
                    Math.round(
                      item.score
                    )
                  )
                ),

              strengths:
                item.strengths
                  .filter(
                    (
                      value
                    ) =>
                      typeof value ===
                      "string"
                  )
                  .map(
                    (
                      value
                    ) =>
                      value.trim()
                  )
                  .filter(
                    (
                      value
                    ) =>
                      value.length > 0
                  ),

              improvements:
                item.improvements
                  .filter(
                    (
                      value
                    ) =>
                      typeof value ===
                      "string"
                  )
                  .map(
                    (
                      value
                    ) =>
                      value.trim()
                  )
                  .filter(
                    (
                      value
                    ) =>
                      value.length > 0
                  ),

              betterAnswer:
                item.betterAnswer.trim(),
            })
          );

      if (
        safeQuestionFeedback.length === 0
      ) {

        throw new Error(
          "Gemini did not return question-by-question feedback."
        );
      }

      const finalAnalysis:
        InterviewAnalysis = {

        overallScore:
          safeOverallScore,

        summary:
          analysis.summary.trim(),

        strengths:
          analysis.strengths
            .filter(
              (
                value
              ) =>
                typeof value ===
                "string"
            )
            .map(
              (
                value
              ) =>
                value.trim()
            )
            .filter(
              (
                value
              ) =>
                value.length > 0
            ),

        improvements:
          analysis.improvements
            .filter(
              (
                value
              ) =>
                typeof value ===
                "string"
            )
            .map(
              (
                value
              ) =>
                value.trim()
            )
            .filter(
              (
                value
              ) =>
                value.length > 0
            ),

        questionFeedback:
          safeQuestionFeedback,
      };

      /* ===============================================
         SAVE FINAL ANALYSIS
      =============================================== */

      sessionStorage.setItem(
        "grfiInterviewAnalysis",
        JSON.stringify(
          finalAnalysis
        )
      );

      /* ===============================================
         ALSO KEEP COMPLETE ANSWERS
      =============================================== */

      sessionStorage.setItem(
        "grfiInterviewAnswers",
        JSON.stringify(
          allAnswers
        )
      );

      console.log(
        "Final interview analysis saved."
      );

      return finalAnalysis;
    };

  /* =========================================================
     SUBMIT ANSWER
     
     IMPORTANT:
     NO GEMINI CALL HERE.
  ========================================================= */

  const handleSubmitAnswer =
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

      /* ===============================================
         CREATE ANSWER RECORD
      =============================================== */

      const answerRecord:
        InterviewAnswer = {

        questionId:
          currentQuestion.id,

        question:
          currentQuestion.question,

        answer:
          trimmedAnswer,
      };

      /* ===============================================
         UPDATE ANSWER COLLECTION
      =============================================== */

      const filteredAnswers =
        interviewAnswers.filter(
          (item) =>
            item.questionId !==
            currentQuestion.id
        );

      const updatedAnswers = [
        ...filteredAnswers,
        answerRecord,
      ].sort(
        (
          first,
          second
        ) =>
          first.questionId -
          second.questionId
      );

      setInterviewAnswers(
        updatedAnswers
      );

      /* ===============================================
         SAVE IMMEDIATELY
      =============================================== */

      sessionStorage.setItem(
        "grfiInterviewAnswers",
        JSON.stringify(
          updatedAnswers
        )
      );

      console.log(
        `Saved answer ${currentQuestionIndex + 1} of ${questions.length}`
      );

      /* ===============================================
         CHECK LAST QUESTION
      =============================================== */

      const isLastQuestion =
        currentQuestionIndex >=
        questions.length - 1;

      if (
        isLastQuestion
      ) {

        /* =============================================
           FINAL ANALYSIS STARTS
        ============================================= */

        try {

          setIsAnalyzingInterview(
            true
          );

          setAnalysisError("");

          stopMedia();

          await analyseCompleteInterview(
            updatedAnswers
          );

          /* =============================================
             FINAL ANALYSIS COMPLETE
          ============================================= */

          setIsInterviewComplete(
            true
          );

          navigate(
            "/interviewResults"
          );

        } catch (error) {

          console.error(
            "Final interview analysis error:",
            error
          );

          setAnalysisError(
            error instanceof Error
              ? error.message
              : "Unable to analyse your complete interview."
          );

        } finally {

          setIsAnalyzingInterview(
            false
          );
        }

        return;
      }

      /* ===============================================
         MOVE TO NEXT QUESTION
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
    };

  /* =========================================================
     END INTERVIEW
  ========================================================= */

  const handleEndInterview =
    () => {

      stopMedia();

      navigate(
        "/"
      );
    };

  /* =========================================================
     FINAL ANALYSIS LOADING SCREEN
  ========================================================= */

  if (
    isAnalyzingInterview
  ) {

    return (

      <main className="realtime-interview">

        <div className="interview-loading">

          <div className="interview-loading__spinner">
            AI
          </div>

          <h1>
            Analysing your interview...
          </h1>

          <p>
            GRFI is reviewing all your answers
            and preparing your personalised
            interview feedback.
          </p>

        </div>

      </main>

    );
  }

  /* =========================================================
     QUESTION GENERATION LOADING
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
     QUESTION ERROR
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
     FINAL ANALYSIS ERROR
  ========================================================= */

  if (
    analysisError
  ) {

    return (

      <main className="realtime-interview">

        <div className="interview-error">

          <div className="interview-error__icon">
            !
          </div>

          <h1>
            We couldn't analyse your interview
          </h1>

          <p>
            {analysisError}
          </p>

          <button
            type="button"
            onClick={() => {

              setAnalysisError("");

              const savedAnswers =
                sessionStorage.getItem(
                  "grfiInterviewAnswers"
                );

              if (!savedAnswers) {
                navigate(
                  "/interviewSetUp"
                );

                return;
              }

              try {

                const parsedAnswers =
                  JSON.parse(
                    savedAnswers
                  ) as InterviewAnswer[];

                setIsAnalyzingInterview(
                  true
                );

                analyseCompleteInterview(
                  parsedAnswers
                )
                  .then(() => {

                    navigate(
                      "/interviewResults"
                    );

                  })
                  .catch(
                    (error) => {

                      setAnalysisError(
                        error instanceof Error
                          ? error.message
                          : "Unable to analyse your interview."
                      );

                    }
                  )
                  .finally(() => {

                    setIsAnalyzingInterview(
                      false
                    );

                  });

              } catch {

                navigate(
                  "/interviewSetUp"
                );
              }
            }}
          >
            Try Analysis Again
          </button>

        </div>

      </main>

    );
  }

  /* =========================================================
     INTERVIEW COMPLETE
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
            Your interview has been analysed.
            Your personalised results are ready.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/interviewResults"
              )
            }
          >
            View Analysis
          </button>

        </div>

      </main>

    );
  }

  /* =========================================================
     MAIN INTERVIEW
  ========================================================= */

  return (

    <main className="realtime-interview">

      {/* ===================================================
          HEADER
      =================================================== */}

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

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="realtime-interview__content">

        {/* =================================================
            AI INTERVIEWER
        ================================================= */}

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

          {/* AI AVATAR */}

          <div className="ai-avatar">

            <div className="ai-avatar__circle">
              AI
            </div>

          </div>

          {/* QUESTION */}

          <div className="ai-question">

            <span>

              QUESTION{" "}

              {currentQuestionIndex + 1}

            </span>

            <h1>

              {currentQuestion?.question}

            </h1>

          </div>

          {/* TEXT TO SPEECH */}

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

        {/* =================================================
            CANDIDATE PANEL
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
              CANDIDATE ANSWER
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
                ANSWER MODES
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
                TYPE ANSWER
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
                SPEAK ANSWER
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
                FINAL ANALYSIS INFORMATION
            ================================================= */}

            <div className="answer-analysis-info">

              <span>
                AI analysis happens after the complete interview.
              </span>

              <p>
                Your answer will be saved and reviewed
                together with your other answers at the end.
              </p>

            </div>

            {/* =================================================
                SUBMIT / NEXT QUESTION
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
                ? "Finish & Analyse Interview"
                : "Save Answer & Next"}

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