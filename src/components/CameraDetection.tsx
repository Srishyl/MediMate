import React, { useRef, useEffect, useState } from 'react';
import * as mp from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

interface CameraDetectionProps {
  onPillTaken: () => void;
}

const CameraDetection: React.FC<CameraDetectionProps> = ({ onPillTaken }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handToMouthProgress, setHandToMouthProgress] = useState(0);
  const [hands, setHands] = useState<mp.Hands | null>(null);

  // Constants for detection
  const MOUTH_Y_POSITION = 0.3; // Approximate mouth position (30% from top)
  const DISTANCE_THRESHOLD = 0.40; // Distance threshold for hand near mouth
  const REQUIRED_FRAMES = 15; // Number of frames required for verification

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Failed to access camera. Please ensure camera permissions are granted.');
        console.error('Camera access error:', err);
      }
    };

    const initializeHands = () => {
      const hands = new mp.Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      hands.onResults((results) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw camera feed
        if (videoRef.current) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }

        // Draw hand landmarks
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(
              ctx, landmarks, HAND_CONNECTIONS,
              { color: '#00FF00', lineWidth: 2 }
            );
            drawLandmarks(
              ctx, landmarks,
              { color: '#FF0000', lineWidth: 1 }
            );

            // Draw approximate mouth position line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.moveTo(0, canvas.height * MOUTH_Y_POSITION);
            ctx.lineTo(canvas.width, canvas.height * MOUTH_Y_POSITION);
            ctx.stroke();
          }
        }

        // Check for hand-to-mouth movement
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const indexTip = landmarks[8]; // Index fingertip
          
          // Calculate distance from hand to mouth area
          const distanceToMouth = Math.abs(indexTip.y - MOUTH_Y_POSITION);

          if (distanceToMouth < DISTANCE_THRESHOLD) {
            setHandToMouthProgress(prev => {
              const newProgress = Math.min(prev + 1, REQUIRED_FRAMES);
              if (newProgress === REQUIRED_FRAMES) {
                onPillTaken();
                return 0;
              }
              return newProgress;
            });
          } else {
            setHandToMouthProgress(0);
          }

          // Draw debug info
          if (ctx) {
            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`Distance to mouth: ${distanceToMouth.toFixed(3)}`, 10, 30);
          }
        }
      });

      setHands(hands);
    };

    const initialize = async () => {
      await setupCamera();
      initializeHands();
    };

    initialize();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (hands) {
        hands.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!hands || !videoRef.current || !canvasRef.current) return;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, [hands]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      {error && (
        <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg">
          {error}
        </div>
      )}
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          {handToMouthProgress > 0 
            ? `Verifying hand-to-mouth movement... (${handToMouthProgress}/${REQUIRED_FRAMES})`
            : 'Move your hand to your mouth to verify pill intake'}
        </p>
        {handToMouthProgress > 0 && (
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-200"
              style={{ width: `${(handToMouthProgress / REQUIRED_FRAMES) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDetection;