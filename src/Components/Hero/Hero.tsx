import { useNavigate } from "react-router-dom";
import "./Hero.css";

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">

      <div className="container hero__container">

        {/* Left side */}
        <div className="hero__content">

          <div className="hero__badge">
            AI-powered interview practice
          </div>

          <h1 className="hero__title">
            Practice the interview
            <span>you're actually going to face.</span>
          </h1>

          <p className="hero__description">
            Upload your CV, add the job description, and let GRFI
            create a personalised interview based on your experience,
            skills and the role you're applying for.
          </p>

          <div className="hero__actions">

            <button className="hero__primary-button" onClick={() => navigate("/interviewSetUp")}>
              Start Interview
              <span>→</span>
            </button>

            <a
              href="#how-it-works"
              className="hero__secondary-button"
            >
              See how it works
            </a>

          </div>

          <p className="hero__note">
            No generic questions. Your CV. Your role. Your interview.
          </p>

        </div>

        {/* Right side */}
        <div className="hero__visual">

          <div className="interview-card">

            <div className="interview-card__header">

              <div className="interviewer-avatar">
                AI
              </div>

              <div>
                <h3>GRFI Interviewer</h3>
                <p>Question 2 of 10</p>
              </div>

              <div className="interview-status">
                ●
              </div>

            </div>

            <div className="interview-card__question">

              <span>QUESTION</span>

              <p>
                You mentioned React and TypeScript in your CV.
                Can you explain how you have used them together
                in one of your projects?
              </p>

            </div>

            <div className="interview-card__answer">
              Your answer...
            </div>

            <button className="interview-card__button">
              Submit Answer
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;