// =========================================================
// GEMINI INTERVIEW QUESTION SERVICE
// =========================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || "gemini-3.8-flash";

const MAX_OUTPUT_TOKENS = 3000;

// =========================================================
// TYPES
// =========================================================

export interface InterviewQuestion {
  id: number;
  question: string;
}

interface GenerateInterviewQuestionsParams {
  cvText: string;
  jobDescription?: string;
  role?: string;
  interviewType?: string;
  difficulty?: string;
  questionCount?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
  };
}

// =========================================================
// GEMINI API CALL
// =========================================================

async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is missing. Please check your .env.local file."
    );
  }

  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
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
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
      },
    }),
  });

  const data: GeminiResponse = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", data);

    throw new Error(
      data.error?.message ||
        `Gemini API request failed with status ${response.status}`
    );
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    console.error("Gemini returned no text:", data);

    throw new Error(
      "Gemini returned an empty response. Please try again."
    );
  }

  return text;
}

// =========================================================
// JSON CLEANER
// =========================================================

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code fences if Gemini adds them
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  return cleaned.trim();
}

// =========================================================
// GENERATE INTERVIEW QUESTIONS
// =========================================================

export async function generateInterviewQuestions({
  cvText,
  jobDescription = "",
  role = "",
  interviewType = "mixed",
  difficulty = "medium",
  questionCount = 10,
}: GenerateInterviewQuestionsParams): Promise<InterviewQuestion[]> {
  if (!cvText.trim()) {
    throw new Error("CV content is required.");
  }

  const systemPrompt = `
You are GRFI, an AI interview coach.

Your job is to create realistic interview questions personalised to the candidate.

Use:
1. The candidate's CV
2. The target job description or role
3. Interview type
4. Difficulty
5. Requested number of questions

Questions should feel like questions asked by a real interviewer.

Important rules:

- Personalise questions using the candidate's actual CV.
- Do not invent companies, projects, skills or experience.
- If the CV mentions a project, you can ask about that project.
- If the CV mentions a technology, you can ask about how they used it.
- Include a mixture of questions when interview type is "mixed".
- Avoid repetitive questions.
- Questions should become progressively challenging where appropriate.
- Keep questions concise and natural.
- Do not provide answers.
- Do not provide explanations.
- Return ONLY valid JSON.
`;

  const userPrompt = `
Create ${questionCount} interview questions.

CANDIDATE CV:
----------------
${cvText}
----------------

TARGET ROLE:
${role || "Not specified"}

JOB DESCRIPTION:
----------------
${jobDescription || "Not provided"}
----------------

INTERVIEW TYPE:
${interviewType}

DIFFICULTY:
${difficulty}

Return exactly this JSON structure:

{
  "questions": [
    {
      "id": 1,
      "question": "Question text"
    }
  ]
}

Requirements:

- Return exactly ${questionCount} questions.
- IDs must start at 1 and increase sequentially.
- Every question must be a string.
- Do not include answers.
- Do not include markdown.
- Do not include extra fields.
- Return valid JSON only.
`;

  try {
    const responseText = await callGemini(
      systemPrompt,
      userPrompt
    );

    console.log("Gemini raw question response:", responseText);

    const cleanedResponse = cleanJsonResponse(responseText);

    let parsed: {
      questions?: InterviewQuestion[];
    };

    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error(
        "AI JSON parsing error:",
        parseError
      );

      console.error(
        "AI returned:",
        cleanedResponse
      );

      throw new Error(
        "Gemini returned invalid JSON. Please try starting the interview again."
      );
    }

    // =====================================================
    // VALIDATE RESPONSE
    // =====================================================

    if (
      !parsed ||
      !Array.isArray(parsed.questions)
    ) {
      console.error(
        "Invalid question structure:",
        parsed
      );

      throw new Error(
        "The AI returned an invalid question format. Please try starting the interview again."
      );
    }

    if (parsed.questions.length === 0) {
      throw new Error(
        "Gemini did not generate any interview questions."
      );
    }

    const validQuestions = parsed.questions.filter(
      (question): question is InterviewQuestion =>
        typeof question.id === "number" &&
        typeof question.question === "string" &&
        question.question.trim().length > 0
    );

    if (validQuestions.length === 0) {
      throw new Error(
        "Gemini returned invalid interview questions."
      );
    }

    // Re-number questions to make sure IDs are clean
    const questions = validQuestions.map(
      (question, index) => ({
        id: index + 1,
        question: question.question.trim(),
      })
    );

    console.log(
      "Generated interview questions:",
      questions
    );

    return questions;
  } catch (error) {
    console.error(
      "generateInterviewQuestions error:",
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Failed to generate interview questions. Please try again."
    );
  }
}