/* =========================================================
   OpenRouter Service
========================================================= */

interface GenerateInterviewQuestionsParams {
  cvText: string;
  jobDescription?: string;
  role?: string;
}

interface GeneratedQuestionsResponse {
  questions: string[];
}

/* =========================================================
   OpenRouter Configuration
========================================================= */

const OPENROUTER_API_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY;

const OPENROUTER_MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL ||
  "openai/gpt-4o-mini";

/* =========================================================
   Generate Interview Questions
========================================================= */

export async function generateInterviewQuestions({
  cvText,
  jobDescription,
  role,
}: GenerateInterviewQuestionsParams): Promise<string[]> {

  /* =======================================================
     Validate API Key
  ======================================================= */

  if (!OPENROUTER_API_KEY) {

    throw new Error(
      "OpenRouter API key is missing. Please check your .env file."
    );

  }

  /* =======================================================
     Validate CV
  ======================================================= */

  if (!cvText.trim()) {

    throw new Error(
      "CV information is required to generate interview questions."
    );

  }

  /* =======================================================
     Determine Interview Context
  ======================================================= */

  const interviewRole =
    role?.trim() ||
    "the candidate's target role";

  const jobDescriptionText =
    jobDescription?.trim()
      ? jobDescription
      : "No job description was provided. Generate questions based on the selected role and the candidate's CV.";

  /* =======================================================
     AI Prompt
  ======================================================= */

  const systemPrompt = `
You are an experienced technical interviewer.

Your job is to generate realistic interview questions
for a candidate based on their CV and the target job.

The questions should feel like questions asked by a
real human interviewer.

Focus on:

- The candidate's actual experience
- Their technical skills
- Their projects
- Their previous responsibilities
- The technologies mentioned in the CV
- The requirements of the job description
- The selected target role
- Practical and scenario-based questions

Avoid generic questions where possible.

Do not invent experience that is not present in the CV.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}

Generate 8 interview questions.
`;

  /* =======================================================
     User Prompt
  ======================================================= */

  const userPrompt = `
Target Role:

${interviewRole}


Job Description:

${jobDescriptionText}


Candidate CV:

${cvText}


Generate interview questions that are specifically
relevant to this candidate and this role.
`;

  /* =======================================================
     API Request
  ======================================================= */

  const response =
    await fetch(
      OPENROUTER_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${OPENROUTER_API_KEY}`,

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

          temperature: 0.7,

          max_tokens: 1200,

        }),
      }
    );

  /* =======================================================
     Handle API Error
  ======================================================= */

  if (!response.ok) {

    let errorMessage =
      "OpenRouter request failed.";

    try {

      const errorData =
        await response.json();

      console.error(
        "OpenRouter API error:",
        errorData
      );

      if (
        errorData?.error?.message
      ) {

        errorMessage =
          errorData.error.message;

      }

    } catch {

      console.error(
        "Could not read OpenRouter error response."
      );

    }

    throw new Error(
      errorMessage
    );

  }

  /* =======================================================
     Read Response
  ======================================================= */

  const data =
    await response.json();

  console.log(
    "OpenRouter response:",
    data
  );

  /* =======================================================
     Extract AI Message
  ======================================================= */

  const content =
    data?.choices?.[0]?.message?.content;

  if (
    !content ||
    typeof content !== "string"
  ) {

    throw new Error(
      "OpenRouter returned an empty response."
    );

  }

  /* =======================================================
     Clean JSON Response
  ======================================================= */

  let cleanedContent =
    content.trim();

  /*
   * Sometimes AI models wrap JSON
   * inside markdown code blocks.
   */

  if (
    cleanedContent.startsWith(
      "```"
    )
  ) {

    cleanedContent =
      cleanedContent
        .replace(
          /^```(?:json)?/i,
          ""
        )
        .replace(
          /```$/,
          ""
        )
        .trim();

  }

  /* =======================================================
     Parse JSON
  ======================================================= */

  let parsedData:
    GeneratedQuestionsResponse;

  try {

    parsedData =
      JSON.parse(
        cleanedContent
      );

  } catch (error) {

    console.error(
      "Failed to parse AI JSON:",
      error
    );

    console.error(
      "AI returned:",
      content
    );

    throw new Error(
      "The AI returned an invalid question format."
    );

  }

  /* =======================================================
     Validate Questions
  ======================================================= */

  if (
    !Array.isArray(
      parsedData.questions
    )
  ) {

    throw new Error(
      "The AI response does not contain a valid questions array."
    );

  }

  const questions =
    parsedData.questions
      .filter(
        (question) =>
          typeof question === "string"
      )
      .map(
        (question) =>
          question.trim()
      )
      .filter(
        (question) =>
          question.length > 0
      );

  if (
    questions.length === 0
  ) {

    throw new Error(
      "No interview questions were generated."
    );

  }

  /* =======================================================
     Return Questions
  ======================================================= */

  return questions;

}