import { useNavigate } from "react-router-dom";
import "./CTA.css";

function CTA() {

  const navigate = useNavigate();
  return (
    <section className="cta">

      <div className="container cta__container">

        <span>READY?</span>

        <h2>
          Your next interview
          starts here.
        </h2>

        <p>
          Upload your CV. Add your job.
          Practice with GRFI.
        </p>

        <button className="cta__button" onClick={() => navigate("/interviewSetUp")}>
          Start Interview →
        </button>

      </div>

    </section>
  );
}

export default CTA;