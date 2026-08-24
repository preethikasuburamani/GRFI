import  { useState } from "react";

const AIInterviewPage = () => {

  const [question, setQuestion] = useState<string>("Tell me about yourself");

  const startSpeaking = () => {
    const speech = new SpeechSynthesisUtterance(question);
    speech.lang = "en-GB";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    
    window.speechSynthesis.speak(speech);


  }


  return (
    <div>
      <button onClick={startSpeaking}>
        Start Speak
      </button>
      <p>{question}</p>
    </div>
  )
}

export default AIInterviewPage