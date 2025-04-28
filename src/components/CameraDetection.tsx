import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check } from 'lucide-react';

interface CameraDetectionProps {
  onPillTaken: () => void;
}

const CameraDetection: React.FC<CameraDetectionProps> = ({ onPillTaken }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPillDetected, setIsPillDetected] = useState(false);
  const [isHandToMouthDetected, setIsHandToMouthDetected] = useState(false);
  const [detectionStage, setDetectionStage] = useState<string>('waiting');

  // Initialize camera when component mounts
  useEffect(() => {
    if (isActive && videoRef.current) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          // For demo purposes, we'll simulate the detection process
          simulateDetectionProcess();
        }
      };

      startCamera();
      
      return () => {
        // Clean up camera stream
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isActive]);

  const startDetection = () => {
    setIsActive(true);
    setDetectionStage('searching');
  };

  // Simulate the detection process for demo purposes
  const simulateDetectionProcess = () => {
    // Simulate pill detection after 2 seconds
    setTimeout(() => {
      setIsPillDetected(true);
      setDetectionStage('pill_detected');
      
      // Simulate hand-to-mouth detection after another 3 seconds
      setTimeout(() => {
        setIsHandToMouthDetected(true);
        setDetectionStage('hand_to_mouth');
        
        // Complete the process after 1 more second
        setTimeout(() => {
          setDetectionStage('completed');
          onPillTaken();
        }, 1000);
      }, 3000);
    }, 2000);
  };

  const getDetectionMessage = () => {
    switch (detectionStage) {
      case 'waiting':
        return 'Press "Start Detection" to begin';
      case 'searching':
        return 'Show the pill to the camera...';
      case 'pill_detected':
        return 'Pill detected! Now take your pill...';
      case 'hand_to_mouth':
        return 'Hand-to-mouth motion detected!';
      case 'completed':
        return 'Pill taken successfully!';
      default:
        return 'Waiting for detection...';
    }
  };

  return (
    <div className="camera-detection w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl overflow-hidden shadow-lg">
        {!isActive ? (
          <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center text-center p-6">
            <Camera className="h-16 w-16 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Pill Detection</h3>
            <p className="text-gray-600 mb-4">
              When ready to take your pill, we'll use your camera to verify you've taken it correctly.
            </p>
            <button
              onClick={startDetection}
              className="btn btn-primary"
            >
              Start Detection
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-video object-cover"
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
              {detectionStage === 'completed' ? (
                <div className="text-center text-white p-4">
                  <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-xl font-bold">{getDetectionMessage()}</p>
                </div>
              ) : (
                <div className="text-center text-white p-4">
                  <div className={`w-24 h-24 rounded-full border-4 border-dashed ${
                    isPillDetected ? 'border-green-400' : 'border-yellow-400'
                  } animate-spin-slow flex items-center justify-center mx-auto mb-4`}>
                    <div className={`w-16 h-16 rounded-full ${
                      isPillDetected ? 'bg-green-400' : 'bg-yellow-400'
                    } bg-opacity-30 flex items-center justify-center`}>
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-xl font-bold">{getDetectionMessage()}</p>
                  
                  {isPillDetected && (
                    <div className="mt-4 flex flex-col items-center">
                      <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: isHandToMouthDetected ? '100%' : '50%' }}
                        ></div>
                      </div>
                      <p className="text-sm">
                        {isHandToMouthDetected ? 'Hand-to-mouth detected' : 'Pill detected'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDetection;