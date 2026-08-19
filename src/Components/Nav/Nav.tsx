import { useNavigate } from "react-router-dom";
import "./Nav.css"

const Nav = () => {

  const navigate = useNavigate();
  return (
     <header className="navbar">
      <div className="container navbar__container">

        <a href="/" className="navbar__brand">
          <span className="navbar__logo">GRFI</span>
          <span className="navbar__tagline">
            Get Ready For Interview
          </span>
        </a>

        <nav className="navbar__links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>

          <button className="navbar__button" onClick={() => navigate("/interviewSetUp")}>
            Start Interview
          </button>
        </nav>

      </div>
    </header>
  )
}

export default Nav