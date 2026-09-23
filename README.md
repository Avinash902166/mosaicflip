# Smile Flip Mosaic - Interactive AI Photobooth Kiosk

An interactive web application designed for a dual-screen photobooth kiosk setup, powered by in-browser neural networks (`@vladmandic/face-api`) for real-time facial expression and mood recognition.

---

## 🚀 Routes

### 1. Vertical Screen (1080 × 1920 Portrait Kiosk)
- **URL**: `http://localhost:5173/#/vertical`
- **Aspect Ratio**: 9:16 (1080 × 1920)
- **Features**:
  - **Mood Indicator Lights**:
    - 🔴 **RED**: Rude / Frown / Angry expression detected
    - 🟡 **YELLOW**: Neutral / Normal face expression
    - 🟢 **GREEN**: Smiling expression detected
  - **Live Camera Feed**: Mirrored selfie view with face guide corners and active status pill.
  - **2-Second Sustained Smile Timer**:
    - When the user smiles (GREEN light), a circular countdown progress gauge begins.
    - If the smile is held for **2.0 continuous seconds**, the camera triggers a shutter flash and sound effect, automatically capturing a high-resolution snapshot!
    - If the user stops smiling before 2 seconds, the timer smoothly resets.
  - **Captured Square Preview (1:1)**:
    - Displayed directly below the camera feed.
    - Square crop formatted for mosaic tiles.
  - **Action Buttons**:
    - **Approve Photo** (Green button): Confirms the photo, plays success fanfare, and broadcasts it to the Mosaic board.
    - **Retake / Reject** (Red/Amber button): Discards the photo and re-arms the camera for another capture.
  - **Interactive Simulation Bar**:
    - Buttons to simulate Smile (2s auto-snap), Neutral, Rude, Instant Snap, or Reset for quick testing without camera permissions.

---

### 2. Horizontal Screen (Landscape Start Controller)
- **URL**: `http://localhost:5173/#/horizontal`
- **Features**:
  - Dynamic mosaic grid background with ambient glowing effects.
  - Glowing **START PHOTOBOOTH** action button.
  - Cross-window synchronization (`BroadcastChannel` & `localStorage`): Clicking Start immediately commands the vertical screen to start a new session.
  - Approved Mosaic Gallery Strip showing the latest approved portraits.
  - Button to open the vertical screen in a separate popup window for dual-monitor kiosks.

---

## 🛠️ Tech Stack
- **HTML5 & Vanilla CSS**: Modern dark glassmorphism theme, CSS custom properties, responsive kiosk frame scaling.
- **Vanilla JavaScript (ES Modules)**: Modular architecture (`main.js`, `router.js`, `faceDetector.js`, `verticalView.js`, `horizontalView.js`, `audio.js`).
- **AI Engine**: `@vladmandic/face-api` (TinyFaceDetector + FaceExpressionNet) running 100% locally with models in `/public/models`.
- **Sound Synthesis**: Web Audio API camera shutter clicks, beeps, and approval fanfare.
- **Dev Server**: Vite 6.
