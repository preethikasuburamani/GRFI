import "./Features.css";

const features = [
  {
    number: "01",
    title: "CV-based questions",
    description:
      "Questions are generated from your actual experience, skills and projects.",
  },
  {
    number: "02",
    title: "Job-specific questions",
    description:
      "Give GRFI a job description and prepare for the requirements that matter.",
  },
  {
    number: "03",
    title: "AI follow-ups",
    description:
      "Your next question can adapt to what you said instead of following a fixed script.",
  },
  {
    number: "04",
    title: "Instant feedback",
    description:
      "Understand what you did well and exactly where your answer can improve.",
  },
  {
    number: "05",
    title: "Real scenarios",
    description:
      "Practice technical, behavioural and real-world interview questions.",
  },
  {
    number: "06",
    title: "Personalised results",
    description:
      "Finish with clear strengths and areas to improve before your real interview.",
  },
];

function Features() {
  return (
    <section
      id="features"
      className="features"
    >
      <div className="container">

        <div className="section-heading">
          <span>WHY GRFI</span>

          <h2>
            Not another list of
            generic interview questions.
          </h2>

          <p>
            GRFI adapts the interview to you and the role you're applying for.
          </p>
        </div>

        <div className="features__grid">

          {features.map((feature) => (
            <article
              className="feature"
              key={feature.number}
            >
              <span className="feature__number">
                {feature.number}
              </span>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>
            </article>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Features;