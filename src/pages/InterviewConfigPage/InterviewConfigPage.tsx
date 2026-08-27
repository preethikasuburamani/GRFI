import { useState } from "react";
import { useNavigate } from "react-router-dom";

import InterviewOptions from "../../Components/Interview/InterviewOptions";

import type {
  InterviewType,
  Difficulty,
} from "../../Components/Interview/InterviewOptions";

import "./InterviewConfigPage.css";

function InterviewConfigPage() {

  const navigate = useNavigate();

  /* =========================================================
     Interview Settings
  ========================================================= */

  const [interviewType, setInterviewType] =
    useState<InterviewType>("mixed");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("medium");

  const [questionCount, setQuestionCount] =
    useState(10);

  /* =========================================================
     Loading / Error
  ========================================================= */

  const [isStarting, setIsStarting] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     Start Interview
  ========================================================= */

  const handleStartInterview = async () => {

    setError("");

    /*
     * Read setup information.
     */

    const jobInputType =
      sessionStorage.getItem(
        "grfiJobInputType"
      );

    const role =
      sessionStorage.getItem(
        "grfiRole"
      ) || "";

    const jobDescription =
      sessionStorage.getItem(
        "grfiJobDescription"
      ) || "";

    const cvFileName =
      sessionStorage.getItem(
        "grfiCvFileName"
      );

    /* =======================================================
       Validate CV
    ======================================================= */

    if (!cvFileName) {

      setError(
        "Your CV information is missing. Please go back and upload your CV again."
      );

      return;
    }

    /* =======================================================
       Validate Job Input
    ======================================================= */

    if (
      jobInputType === "jd" &&
      !jobDescription.trim()
    ) {

      setError(
        "Please paste a job description or go back and select a role."
      );

      return;
    }

    if (
      jobInputType === "role" &&
      !role
    ) {

      setError(
        "Please select a target role."
      );

      return;
    }

    try {

      setIsStarting(true);

      /*
       * Save interview configuration.
       */

      sessionStorage.setItem(
        "grfiInterviewType",
        interviewType
      );

      sessionStorage.setItem(
        "grfiDifficulty",
        difficulty
      );

      sessionStorage.setItem(
        "grfiQuestionCount",
        String(questionCount)
      );

      console.log(
        "Interview configuration:",
        {
          interviewType,
          difficulty,
          questionCount,
          jobInputType,
          role,
          jobDescription,
          cvFileName,
        }
      );

      /*
       * We are NOT calling OpenRouter yet.
       *
       * CV text extraction comes next.
       */

      navigate("/AIInterview");

    } catch (error) {

      console.error(
        "Unable to start interview:",
        error
      );

      setError(
        "Something went wrong while starting the interview."
      );

    } finally {

      setIsStarting(false);

    }

  };

  return (

    <main className="config-page">

      <div className="config-page__container">

        {/* =================================================
            Header
        ================================================= */}

        <header className="config-page__header">

          <span>
            STEP 2 OF 2
          </span>

          <h1>
            Configure your interview
          </h1>

          <p>
            Choose how you want GRFI to structure your
            personalised interview.
          </p>

        </header>

        {/* =================================================
            Configuration
        ================================================= */}

        <section className="config-card">

          <InterviewOptions
            interviewType={interviewType}
            difficulty={difficulty}
            questionCount={questionCount}
            onInterviewTypeChange={
              setInterviewType
            }
            onDifficultyChange={
              setDifficulty
            }
            onQuestionCountChange={
              setQuestionCount
            }
          />

        </section>

        {/* =================================================
            Error
        ================================================= */}

        {error && (

          <div className="config-error">
            {error}
          </div>

        )}

        {/* =================================================
            Footer
        ================================================= */}

        <div className="config-page__footer">

          <button
            type="button"
            className="config-page__back"
            onClick={() =>
              navigate(
                "/interviewSetUp"
              )
            }
            disabled={isStarting}
          >
            ← Back
          </button>

          <button
            type="button"
            className="config-page__start"
            onClick={
              handleStartInterview
            }
            disabled={isStarting}
          >

            {isStarting
              ? "Starting..."
              : "Start Interview"}

            {!isStarting && (
              <span>
                →
              </span>
            )}

          </button>

        </div>

      </div>

    </main>

  );
}

export default InterviewConfigPage;