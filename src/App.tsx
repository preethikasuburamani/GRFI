import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import LandingPage from './pages/LandingPage/LandingPage';
import InterviewSetUpPage from "./pages/InterviewSetUpPage/InterviewSetUpPage";
import InterviewConfigPage from "./pages/InterviewConfigPage/InterviewConfigPage";
import AIInterviewPage from "./pages/AIInterviewPage/AIInterviewPage";


const App = () => {
  return (

    
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interviewSetUp" element={<InterviewSetUpPage />} />
        <Route path="/interviewConfig" element={<InterviewConfigPage />} />
        <Route path="/AIInterview" element={<AIInterviewPage />} />
      
      </Routes>
    </Router>
  )
}

export default App