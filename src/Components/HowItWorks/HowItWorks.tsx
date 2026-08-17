import "./HowItWorks.css";

const steps = [
  {
    number: "01",
    title: "Upload your CV",
    description:
      "GRFI analyses your experience, skills, projects and technologies.",
  },
  {
    number: "02",
    title: "Add the job",
    description:
      "Paste the job description or choose the role you're preparing for.",
  },
  {
    number: "03",
    title: "Start your interview",
    description:
      "Answer personalised questions and receive feedback from AI.",
  },
];

function HowItWorks() {
  
  return (
    <section
      id="how-it-works"
      className="how-it-works"
    >
      <div className="container">

        <div className="section-heading">
          <span>HOW IT WORKS</span>

          <h2>
            From your CV to your
            personalised interview.
          </h2>

          <p>
            Three simple steps. No generic interview preparation.
          </p>
        </div>

        <div className="steps">

          {steps.map((step) => (
            <article
              className="step"
              key={step.number}
            >
              <span className="step__number">
                {step.number}
              </span>

              <h3>{step.title}</h3>

              <p>{step.description}</p>
            </article>
          ))}

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;