import { useRef } from 'react';

const VedioAndAudio = () => {

    const videoRef = useRef<HTMLVideoElement | null>(null);
  

    const HandleCameraAndAudio = async  () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;

            }
        } catch (error) {
            console.error("Error accessing camera and audio:", error);
        }
    }

    
  return (
    <div>
        <button onClick={HandleCameraAndAudio}>
            Start Vedio and Audio
        </button>

        <video autoPlay ref = {videoRef} muted playsInline></video>
    
       
        
    </div>
  )
}

export default VedioAndAudio