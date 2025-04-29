import cv2
import mediapipe as mp
import numpy as np
import time
import math

# Initialize MediaPipe solutions
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Initialize webcam
cap = cv2.VideoCapture(0)

# Configure MediaPipe models
hands = mp_hands.Hands(
    model_complexity=1,  # Increased complexity for better accuracy
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
    max_num_hands=2)  # Allow detection of both hands

face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
    refine_landmarks=True)  # Enable refined lips landmarks

# Define key mouth landmarks
# Lips landmarks in MediaPipe Face Mesh
LIPS_INDICES = [
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
    291, 375, 321, 405, 314, 17, 84, 181, 91, 146,
    78, 62, 76, 77, 96, 191, 80, 81, 82, 13, 312, 311, 310, 
    415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95
]

# Define hand fingertip landmarks
FINGERTIPS = [4, 8, 12, 16, 20]  # Thumb, index, middle, ring, pinky tips

# Variables for tracking hand-to-mouth gesture
hand_to_mouth = False
last_detection_time = 0
detection_cooldown = 0.5  # seconds
proximity_threshold = 80  # pixels - distance to consider near mouth

# Function to calculate distance between two points
def euclidean_distance(point1, point2):
    return math.sqrt((point1[0] - point2[0])*2 + (point1[1] - point2[1])*2)

# Function to find the center point of a set of points
def find_center(points):
    if not points:
        return None
    x_sum = sum(p[0] for p in points)
    y_sum = sum(p[1] for p in points)
    return (int(x_sum / len(points)), int(y_sum / len(points)))

while cap.isOpened():
    success, image = cap.read()
    if not success:
        print("Ignoring empty camera frame.")
        continue

    # Flip the image horizontally for a selfie-view display
    image = cv2.flip(image, 1)
    
    # To improve performance, optionally mark the image as not writeable
    image.flags.writeable = False
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process hands and face
    hand_results = hands.process(image)
    face_results = face_mesh.process(image)
    
    # Prepare for drawing
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    # Variables for landmarks
    mouth_points = []
    mouth_center = None
    hand_points = []
    
    # Extract face landmarks if detected
    if face_results.multi_face_landmarks:
        for face_landmarks in face_results.multi_face_landmarks:
            # Extract and draw only mouth landmarks
            for idx in LIPS_INDICES:
                x = int(face_landmarks.landmark[idx].x * image.shape[1])
                y = int(face_landmarks.landmark[idx].y * image.shape[0])
                mouth_points.append((x, y))
                cv2.circle(image, (x, y), 1, (0, 255, 0), -1)
            
            # Draw mouth area
            if mouth_points:
                mouth_hull = cv2.convexHull(np.array(mouth_points))
                cv2.drawContours(image, [mouth_hull], 0, (0, 255, 0), 2)
                
                # Calculate mouth center
                mouth_center = find_center(mouth_points)
                if mouth_center:
                    cv2.circle(image, mouth_center, 3, (0, 255, 255), -1)
    
    # Extract hand landmarks if detected
    if hand_results.multi_hand_landmarks:
        for hand_landmarks in hand_results.multi_hand_landmarks:
            # Draw hand landmarks
            mp_drawing.draw_landmarks(
                image,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style())
            
            # Extract fingertip positions
            for tip_id in FINGERTIPS:
                tip_x = int(hand_landmarks.landmark[tip_id].x * image.shape[1])
                tip_y = int(hand_landmarks.landmark[tip_id].y * image.shape[0])
                hand_points.append((tip_x, tip_y))
                # Mark fingertips with blue circles
                cv2.circle(image, (tip_x, tip_y), 5, (255, 0, 0), -1)
    
    # Check if any hand point is near mouth
    current_time = time.time()
    near_mouth = False
    closest_distance = float('inf')
    
    if mouth_center and hand_points:
        # Check distance of each fingertip to mouth center
        for hand_point in hand_points:
            distance = euclidean_distance(hand_point, mouth_center)
            if distance < closest_distance:
                closest_distance = distance
            
            # Draw distance line if close enough
            if distance < proximity_threshold * 1.5:
                cv2.line(image, hand_point, mouth_center, (0, 165, 255), 2)
                
            # Check if any finger is very close to mouth
            if distance < proximity_threshold:
                near_mouth = True
                # Mark the close fingertip with a red circle
                cv2.circle(image, hand_point, 8, (0, 0, 255), -1)
    
    # Update hand_to_mouth status
    if near_mouth and current_time - last_detection_time > detection_cooldown:
        hand_to_mouth = True
        last_detection_time = current_time
    
    # Display detection status with visual cues
    if hand_to_mouth and current_time - last_detection_time < detection_cooldown * 2:
        # Create an attention-grabbing alert
        cv2.putText(image, "HAND TO MOUTH DETECTED!", (10, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        # Add a highlight rectangle at the top of the frame
        cv2.rectangle(image, (0, 0), (image.shape[1], 70), (0, 0, 255), -1)
        cv2.putText(image, "HAND TO MOUTH DETECTED!", (image.shape[1]//2 - 200, 40), 
                    cv2.FONT_HERSHEY_DUPLEX, 1, (255, 255, 255), 2)
    else:
        hand_to_mouth = False
        cv2.putText(image, "Monitoring hand position...", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    # Display distance information if we have mouth and hand data
    if mouth_center and hand_points and closest_distance != float('inf'):
        distance_text = f"Distance to mouth: {int(closest_distance)}px"
        threshold_text = f"Threshold: {proximity_threshold}px"
        cv2.putText(image, distance_text, (10, image.shape[0] - 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(image, threshold_text, (10, image.shape[0] - 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Display instructions
    cv2.putText(image, "Press 'q' to quit | 'a'/'d' to adjust sensitivity", 
                (10, image.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    # Show the image
    cv2.imshow('Hand to Mouth Detection', image)
    
    # Handle keypresses
    key = cv2.waitKey(5) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('a'):  # Decrease threshold (more sensitive)
        proximity_threshold = max(20, proximity_threshold - 10)
    elif key == ord('d'):  # Increase threshold (less sensitive)
        proximity_threshold = min(200, proximity_threshold + 10)

# Release resources
cap.release()
cv2.destroyAllWindows()