import "./InterviewOptions.css";

export type InterviewType =
  | "technical"
  | "behavioural"
  | "mixed";

export type Difficulty =
  | "easy"
  | "medium"
  | "hard";

interface InterviewOptionsProps {
  interviewType: InterviewType;
  difficulty: Difficulty;
  questionCount: number;

  onInterviewTypeChange: (
    type: InterviewType
  ) => void;

  onDifficultyChange: (
    difficulty: Difficulty
  ) => void;

  onQuestionCountChange: (
    count: number
  ) => void;
}

function InterviewOptions({
  interviewType,
  difficulty,
  questionCount,
  onInterviewTypeChange,
  onDifficultyChange,
  onQuestionCountChange,
}: InterviewOptionsProps) {
  return (
    <div className="interview-options">

      {/* Interview Type */}

      <div className="option-group">

        <div className="option-group__heading">
          <h3>Interview Type</h3>

          <p>
            What type of interview do you want to practise?
          </p>
        </div>

        <div className="option-cards">

          <button
            type="button"
            className={
              interviewType === "technical"
                ? "option-card active"
                : "option-card"
            }
            onClick={() =>
              onInterviewTypeChange("technical")
            }
          >
            <strong>Technical</strong>

            <span>
              Coding, tools, technologies and technical concepts.
            </span>
          </button>

          <button
            type="button"
            className={
              interviewType === "behavioural"
                ? "option-card active"
                : "option-card"
            }
            onClick={() =>
              onInterviewTypeChange("behavioural")
            }
          >
            <strong>Behavioural</strong>

            <span>
              Experience, teamwork and situation-based questions.
            </span>
          </button>

          <button
            type="button"
            className={
              interviewType === "mixed"
                ? "option-card active"
                : "option-card"
            }
            onClick={() =>
              onInterviewTypeChange("mixed")
            }
          >
            <strong>Mixed</strong>

            <span>
              A combination of technical and behavioural questions.
            </span>
          </button>

        </div>
      </div>

      {/* Difficulty */}

      <div className="option-group">

        <div className="option-group__heading">
          <h3>Difficulty</h3>

          <p>
            Choose how challenging you want the interview to be.
          </p>
        </div>

        <div className="difficulty-options">

          {(["easy", "medium", "hard"] as Difficulty[]).map(
            (level) => (
              <button
                type="button"
                key={level}
                className={
                  difficulty === level
                    ? "difficulty-option active"
                    : "difficulty-option"
                }
                onClick={() =>
                  onDifficultyChange(level)
                }
              >
                {level.charAt(0).toUpperCase() +
                  level.slice(1)}
              </button>
            )
          )}

        </div>
      </div>

      {/* Question Count */}

      <div className="option-group">

        <div className="option-group__heading">
          <h3>Number of Questions</h3>

          <p>
            How many questions would you like?
          </p>
        </div>

        <div className="question-count-options">

          {[5, 10, 15, 20].map((count) => (
            <button
              type="button"
              key={count}
              className={
                questionCount === count
                  ? "question-count active"
                  : "question-count"
              }
              onClick={() =>
                onQuestionCountChange(count)
              }
            >
              {count}
            </button>
          ))}

        </div>

      </div>

    </div>
  );
}

export default InterviewOptions;