import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import LandingPage from './pages/LandingPage/LandingPage';
import InterviewSetUpPage from "./pages/InterviewSetUpPage/InterviewSetUpPage";


const App = () => {
  return (

    
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interviewSetUp" element={<InterviewSetUpPage />} />

      </Routes>
    </Router>
  )
}

export default App