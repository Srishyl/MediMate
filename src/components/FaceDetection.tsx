import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, UserCheck2 } from 'lucide-react';

interface FaceDetectionProps {
  onFaceDetected: (faceId: string) => void;
  mode: 'login' | 'register';
}

const FaceDetection: React.FC<FaceDetectionProps> = ({ onFaceDetected, mode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        // For demo purposes, we'll just pretend models are loaded
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    loadModels();
  }, []);

  // Start webcam
  useEffect(() => {
    if (!isLoading) {
      const startVideo = async () => {
        try {
          if (videoRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing webcam:', error);
          // Mock face detection for demo purposes
          setTimeout(() => {
            setIsFaceDetected(true);
            startCountdown();
          }, 3000);
        }
      };
      
      startVideo();
    }
  }, [isLoading]);

  // Face detection logic
  useEffect(() => {
    if (!isLoading && videoRef.current && !isFaceDetected) {
      const detectFace = async () => {
        // In a real app, this would detect actual faces
        // For demo purposes, we'll simulate face detection
        setTimeout(() => {
          setIsFaceDetected(true);
          startCountdown();
        }, 3000);
      };

      detectFace();
    }
  }, [isLoading, isFaceDetected]);

  const startCountdown = () => {
    setCountdown(3);
  };

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Generate a mock faceId
      const mockFaceId = Math.random().toString(36).substring(2, 15);
      onFaceDetected(mockFaceId);
    }
  }, [countdown, onFaceDetected]);

  return (
    <div className="face-detection-container relative w-full max-w-md mx-auto">
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-white ml-4">Loading face detection...</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-cover"
            />
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {isFaceDetected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <UserCheck2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-xl font-bold mb-2">Face Detected!</p>
                  {countdown !== null && (
                    <p className="text-3xl font-bold">{countdown}</p>
                  )}
                </div>
              </div>
            )}
            
            {!isFaceDetected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-32 h-32 rounded-full border-2 border-dashed border-blue-400 animate-pulse flex items-center justify-center mx-auto">
                    <Camera className="h-12 w-12 text-blue-400" />
                  </div>
                  <p className="mt-4 text-lg">
                    {mode === 'login' ? 'Position your face for recognition' : 'Position your face to register'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-4 text-center text-gray-500">
        {mode === 'login' 
          ? 'Looking for your registered face...' 
          : 'We\'ll use this to recognize you next time'}
      </div>
    </div>
  );
};

export default FaceDetection;