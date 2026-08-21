import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InterviewOptions from "../../Components/Interview/InterviewOptions";
import type{
  InterviewType,
  Difficulty,
} from "../../Components/Interview/InterviewOptions";
import "./InterviewConfigPage.css";

function InterviewConfigPage() {
  const navigate = useNavigate();

  const [interviewType, setInterviewType] =
    useState<InterviewType>("mixed");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("medium");

  const [questionCount, setQuestionCount] =
    useState(10);

  const handleStartInterview = () => {
    console.log({
      interviewType,
      difficulty,
      questionCount,
    });

    navigate("/AIInterview");
  };

  return (
    <main className="config-page">

      <div className="config-page__container">

        <header className="config-page__header">

          <span>STEP 2 OF 2</span>

          <h1>
            Configure your interview
          </h1>

          <p>
            Choose how you want GRFI to structure your
            personalised interview.
          </p>

        </header>

        <section className="config-card">

          <InterviewOptions
            interviewType={interviewType}
            difficulty={difficulty}
            questionCount={questionCount}
            onInterviewTypeChange={setInterviewType}
            onDifficultyChange={setDifficulty}
            onQuestionCountChange={setQuestionCount}
          />

        </section>

        <div className="config-page__footer">

          <button
            type="button"
            className="config-page__back"
            onClick={() =>
              navigate("/interviewSetUp")
            }
          >
            ← Back
          </button>

          <button
            type="button"
            className="config-page__start"
            onClick={handleStartInterview}
          >
            Start Interview
            <span>→</span>
          </button>

        </div>

      </div>

    </main>
  );
}

export default InterviewConfigPage;