import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./InterviewResultsPage.css";

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

function InterviewResultsPage() {
  const navigate = useNavigate();

  const interviewAnswers = useMemo<InterviewAnswer[]>(() => {
    try {
      const savedAnswers = sessionStorage.getItem(
        "grfiInterviewAnswers"
      );

      if (!savedAnswers) {
        return [];
      }

      const parsed = JSON.parse(savedAnswers);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed;
    } catch (error) {
      console.error(
        "Failed to read interview results:",
        error
      );

      return [];
    }
  }, []);

  // =========================================================
  // CALCULATE RESULTS
  // =========================================================

  const totalQuestions = interviewAnswers.length;

  const totalScore = interviewAnswers.reduce(
    (total, item) =>
      total + (item.evaluation?.score || 0),
    0
  );

  const averageScore =
    totalQuestions > 0
      ? totalScore / totalQuestions
      : 0;

  const percentageScore =
    totalQuestions > 0
      ? Math.round((averageScore / 10) * 100)
      : 0;

  // =========================================================
  // PERFORMANCE MESSAGE
  // =========================================================

  const performanceMessage = (() => {
    if (percentageScore >= 80) {
      return {
        title: "Strong performance",
        description:
          "You demonstrated strong interview skills across your answers. Keep refining your examples and delivery.",
      };
    }

    if (percentageScore >= 60) {
      return {
        title: "Good foundation",
        description:
          "You have a solid foundation. Focus on the improvement areas below to make your answers stronger.",
      };
    }

    return {
      title: "Room to improve",
      description:
        "Use the feedback from this interview to strengthen your answers and practise again.",
    };
  })();

  // =========================================================
  // NO RESULTS
  // =========================================================

  if (interviewAnswers.length === 0) {
    return (
      <main className="results-page">
        <div className="results-page__empty">
          <div className="results-page__empty-icon">
            ?
          </div>

          <h1>No interview results found</h1>

          <p>
            Complete an interview first to see your
            personalised results.
          </p>

          <button
            type="button"
            onClick={() => navigate("/interviewSetUp")}
          >
            Start Interview
            <span>→</span>
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // RESULTS PAGE
  // =========================================================

  return (
    <main className="results-page">
      <div className="results-page__container">

        {/* HEADER */}
        <header className="results-page__header">
          <span className="results-page__eyebrow">
            INTERVIEW COMPLETE
          </span>

          <h1>Your interview results</h1>

          <p>
            Review your performance and the personalised
            feedback generated from your answers.
          </p>
        </header>

        {/* SCORE CARD */}
        <section className="results-score-card">

          <div className="results-score-card__main">
            <div className="results-score">
              <span className="results-score__number">
                {averageScore.toFixed(1)}
              </span>

              <span className="results-score__out-of">
                / 10
              </span>
            </div>

            <div className="results-score-card__text">
              <h2>{performanceMessage.title}</h2>

              <p>
                {performanceMessage.description}
              </p>
            </div>
          </div>

          <div className="results-score-card__stats">

            <div className="results-stat">
              <span className="results-stat__value">
                {totalQuestions}
              </span>

              <span className="results-stat__label">
                Questions
              </span>
            </div>

            <div className="results-stat">
              <span className="results-stat__value">
                {percentageScore}%
              </span>

              <span className="results-stat__label">
                Overall score
              </span>
            </div>

            <div className="results-stat">
              <span className="results-stat__value">
                {interviewAnswers.filter(
                  (item) =>
                    item.evaluation?.score >= 8
                ).length}
              </span>

              <span className="results-stat__label">
                Strong answers
              </span>
            </div>

          </div>
        </section>

        {/* QUESTION BREAKDOWN */}
        <section className="results-section">

          <div className="results-section__header">
            <div>
              <span className="results-section__number">
                01
              </span>

              <h2>Question breakdown</h2>
            </div>

            <span className="results-section__count">
              {totalQuestions} questions
            </span>
          </div>

          <div className="results-question-list">

            {interviewAnswers.map(
              (item, index) => (
                <article
                  className="results-question"
                  key={item.questionId || index}
                >

                  <div className="results-question__top">

                    <span className="results-question__number">
                      Q{index + 1}
                    </span>

                    <div className="results-question__question">
                      <h3>
                        {item.question}
                      </h3>

                      <div
                        className={
                          item.evaluation.score >= 8
                            ? "results-badge results-badge--strong"
                            : item.evaluation.score >= 6
                            ? "results-badge results-badge--good"
                            : "results-badge results-badge--improve"
                        }
                      >
                        {item.evaluation.score}/10
                      </div>
                    </div>

                  </div>

                  {/* YOUR ANSWER */}
                  <div className="results-answer-block">

                    <span className="results-answer-block__label">
                      Your answer
                    </span>

                    <p>
                      {item.answer ||
                        "No answer provided."}
                    </p>

                  </div>

                  {/* STRENGTHS */}
                  {item.evaluation?.strengths?.length >
                    0 && (
                    <div className="results-feedback">

                      <div className="results-feedback__column">

                        <span className="results-feedback__label">
                          What you did well
                        </span>

                        <ul>
                          {item.evaluation.strengths.map(
                            (strength, strengthIndex) => (
                              <li
                                key={strengthIndex}
                              >
                                {strength}
                              </li>
                            )
                          )}
                        </ul>

                      </div>

                    </div>
                  )}

                  {/* IMPROVEMENTS */}
                  {item.evaluation?.improvements
                    ?.length > 0 && (
                    <div className="results-feedback">

                      <div className="results-feedback__column">

                        <span className="results-feedback__label">
                          What to improve
                        </span>

                        <ul>
                          {item.evaluation.improvements.map(
                            (
                              improvement,
                              improvementIndex
                            ) => (
                              <li
                                key={
                                  improvementIndex
                                }
                              >
                                {improvement}
                              </li>
                            )
                          )}
                        </ul>

                      </div>

                    </div>
                  )}

                  {/* BETTER ANSWER */}
                  {item.evaluation?.betterAnswer && (
                    <div className="results-better-answer">

                      <span className="results-better-answer__label">
                        Example of a stronger answer
                      </span>

                      <p>
                        {item.evaluation.betterAnswer}
                      </p>

                    </div>
                  )}

                </article>
              )
            )}

          </div>
        </section>

        {/* FOOTER ACTIONS */}
        <div className="results-page__footer">

          <button
            type="button"
            className="results-page__secondary"
            onClick={() => {
              sessionStorage.removeItem(
                "grfiInterviewAnswers"
              );

              navigate("/interviewSetUp");
            }}
          >
            Practise Again
          </button>

          <button
            type="button"
            className="results-page__primary"
            onClick={() => navigate("/")}
          >
            Back to GRFI
            <span>→</span>
          </button>

        </div>

      </div>
    </main>
  );
}

export default InterviewResultsPage;