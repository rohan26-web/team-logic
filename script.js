// --- JAVASCRIPT FOR INTERACTIVITY AND AI ---

// DOM Elements
const videoElement = document.getElementById('webcam-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const timerDisplay = document.getElementById('timer-display');
const mainControlBtn = document.getElementById('main-control-btn');
const endLogBtn = document.getElementById('end-log-btn');
const distractionsCountDisplay = document.getElementById('distractions-count');
const focusScoreDisplay = document.getElementById('focus-score-display');
const focusScorePercent = document.getElementById('focus-score-percent');
const focusScoreMessage = document.getElementById('focus-score-message');
const focusProgressCircle = document.getElementById('focus-progress-circle');
const historyDuration = document.getElementById('history-duration');
const historyDistractionCount = document.getElementById('history-distraction-count');
const historyScore = document.getElementById('history-score');
const animatedSections = [
    document.getElementById('header-section'),
    document.getElementById('main-content-section'),
    document.getElementById('footer-section')
];

// Modal DOM Elements
const modal = document.getElementById('custom-modal');
const modalContent = document.getElementById('modal-content');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = document.getElementById('modal-close-btn');

// State Variables
let totalSeconds = 0;
let intervalId = null;
let sessionState = 'inactive';
let distractionCount = 0;
// This object will hold the data for the *most recent* session for display purposes.
let lastSessionData = { duration: '--', distractions: '--', score: '--' };
let distractionDetected = false;

// AI and Camera Variables
let camera = null;
let faceMesh = null;


// --- MODAL CONTROLS ---

function showModal(title, message) {
    modalTitle.textContent = title;
    modalBody.innerHTML = message; // Use innerHTML for formatted text
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}


// --- AI AND WEBCAM CONTROLS ---

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const topLip = landmarks[13];
        const bottomLip = landmarks[14];
        const lipDistance = Math.hypot(topLip.x - bottomLip.x, topLip.y - bottomLip.y);
        if (lipDistance > 0.08) triggerDistraction("Yawning");

        const noseTip = landmarks[1];
        const leftEdge = landmarks[234];
        const rightEdge = landmarks[454];
        const noseToLeftDist = Math.hypot(noseTip.x - leftEdge.x, noseTip.y - leftEdge.y);
        const noseToRightDist = Math.hypot(noseTip.x - rightEdge.x, noseTip.y - rightEdge.y);
        const ratio = noseToLeftDist / noseToRightDist;
        if (ratio > 2.0 || ratio < 0.5) triggerDistraction("Looking Away");
    }
    canvasCtx.restore();
}

function triggerDistraction(reason) {
    if (sessionState === 'running' && !distractionDetected) {
        distractionDetected = true;
        showModal('Distraction Detected!', `You seem to be ${reason.toLowerCase()}. The session has been paused.`);
        handlePause();
        setTimeout(() => { distractionDetected = false; }, 3000);
    }
}

async function startWebcam() {
    if (camera) return;
    cameraPlaceholder.style.display = 'none';
    videoElement.style.display = 'block';

    faceMesh = new FaceMesh({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    faceMesh.onResults(onResults);

    camera = new Camera(videoElement, {
        onFrame: async () => {
            if (videoElement.readyState >= 3) {
                await faceMesh.send({image: videoElement});
            }
        },
        width: 1280,
        height: 720
    });
    await camera.start();
}

function stopWebcam() {
    if (!camera) return;
    camera.stop();
    const stream = videoElement.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
    camera = null;
    faceMesh = null;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    cameraPlaceholder.style.display = 'flex';
}


// --- CORE UTILITY FUNCTIONS ---

function formatTime(sec) {
    const hours = String(Math.floor(sec / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const seconds = String(sec % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function updateTimerDisplay() { timerDisplay.textContent = formatTime(totalSeconds); }
function updateDistractionsDisplay() { distractionsCountDisplay.textContent = distractionCount; }

function updateFocusScore() {
    const circumference = 219.91;
    let penalty = distractionCount > 0 ? 10 + ((distractionCount - 1) * 5) : 0;
    let score = Math.max(0, 100 - penalty);
    let message = "Session Inactive.";

    if (sessionState === 'running' || sessionState === 'paused' || totalSeconds > 0) {
        if (score === 100) message = "Perfect Focus!";
        else if (score >= 80) message = "Excellent Focus!";
        else if (score >= 60) message = "Average Focus.";
        else message = "Needs Improvement.";
    }
    if (sessionState === 'paused') message = "Session Paused.";

    const offset = circumference * (1 - (score / 100));
    const displayScore = sessionState === 'inactive' && totalSeconds === 0 ? '--' : score;
    const displayPercent = sessionState === 'inactive' && totalSeconds === 0 ? '--%' : `${score}%`;

    focusScoreDisplay.textContent = displayScore;
    focusScorePercent.textContent = displayPercent;
    focusProgressCircle.style.strokeDashoffset = offset;
    focusProgressCircle.style.stroke = score >= 80 ? '#4CAF50' : score >= 60 ? '#FFC107' : '#F44336';
    focusScoreMessage.textContent = message;
}

function updateHistoryDisplay() {
    historyDuration.textContent = lastSessionData.duration;
    historyDistractionCount.textContent = lastSessionData.distractions;
    historyScore.textContent = `${lastSessionData.score}%`;
}


// --- TIMER AND STATE CONTROLS ---

function startTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        totalSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
}

function setControlButtons(running) {
    endLogBtn.disabled = !running && totalSeconds === 0;
    endLogBtn.classList.toggle('bg-gray-400', endLogBtn.disabled);
    endLogBtn.classList.toggle('bg-red-500', !endLogBtn.disabled);
    endLogBtn.classList.toggle('hover:bg-red-600', !endLogBtn.disabled);
}

async function handleStart() {
    if (sessionState === 'inactive') {
        await startWebcam();
        totalSeconds = 0;
        distractionCount = 0;
        updateDistractionsDisplay();
    }
    startTimer();
    sessionState = 'running';
    mainControlBtn.textContent = 'Pause Session';
    mainControlBtn.className = 'w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition shadow-lg';
    setControlButtons(true);
    updateFocusScore();
}

function handlePause() {
    distractionCount++;
    updateDistractionsDisplay();
    stopTimer();
    sessionState = 'paused';
    mainControlBtn.textContent = 'Resume Session';
    mainControlBtn.className = 'w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition shadow-lg';
    setControlButtons(false);
    updateFocusScore();
}

function handleEndAndLog() {
    stopTimer();
    stopWebcam();
    
    if (totalSeconds > 0) {
        updateFocusScore();

        // Create an object for the completed session
        const newSession = {
            duration: formatTime(totalSeconds),
            distractions: distractionCount,
            score: focusScoreDisplay.textContent
        };
        
        // Load, update, and save the session history
        let history = JSON.parse(localStorage.getItem('focusAiHistory')) || [];
        history.unshift(newSession); // Add new session to the beginning
        history = history.slice(0, 5); // Keep only the last 5 sessions
        localStorage.setItem('focusAiHistory', JSON.stringify(history));

        // Update the display with the session that just ended
        lastSessionData = newSession;
        updateHistoryDisplay();

        const summaryMessage = `Great work! Here is your summary:<br><br>
                              <b class="text-gray-800">Duration:</b> ${newSession.duration}<br>
                              <b class="text-gray-800">Distractions:</b> ${newSession.distractions}<br>
                              <b class="text-gray-800">Final Score:</b> ${newSession.score}%`;
        showModal('Session Ended!', summaryMessage);
    }
    
    sessionState = 'inactive';
    totalSeconds = 0;
    distractionCount = 0;
    updateTimerDisplay();
    updateDistractionsDisplay();
    updateFocusScore();
    mainControlBtn.textContent = 'Start Session';
    mainControlBtn.className = 'w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition shadow-lg';
    setControlButtons(false);
}


// --- CONTROL LISTENERS ---

mainControlBtn.addEventListener('click', () => {
    if (sessionState === 'running') {
        handlePause();
    } else {
        handleStart();
    }
});

endLogBtn.addEventListener('click', handleEndAndLog);
modalCloseBtn.addEventListener('click', hideModal);


// --- ANIMATION AND INITIALIZATION ---

function animateDashboard() {
    animatedSections.forEach((section, index) => {
        setTimeout(() => {
            section.classList.add('loaded');
        }, index * 200);
    });
}

window.onload = () => {
    // Load the entire history from local storage
    const history = JSON.parse(localStorage.getItem('focusAiHistory')) || [];
    
    // If history exists, set the 'lastSessionData' to the most recent entry
    if (history.length > 0) {
        lastSessionData = history[0];
    }

    animateDashboard();
    updateTimerDisplay();
    updateFocusScore();
    updateDistractionsDisplay();
    updateHistoryDisplay(); // This will now show the most recent session from the saved history
    setControlButtons(false);
function handleEndAndLog() {
    stopTimer();
    stopWebcam();
    
    if (totalSeconds > 0) {
        updateFocusScore();

        // Create an object for the completed session
        const newSession = {
            duration: formatTime(totalSeconds),
            distractions: distractionCount,
            score: focusScoreDisplay.textContent
        };
        
        // ... (code to save history) ...

        // This is the part that creates and shows the pop-up
        const summaryMessage = `Great work! Here is your summary:<br><br>
                              <b class="text-gray-800">Duration:</b> ${newSession.duration}<br>
                              <b class="text-gray-800">Distractions:</b> ${newSession.distractions}<br>
                              <b class="text-gray-800">Final Score:</b> ${newSession.score}%`;
        showModal('Session Ended!', summaryMessage);
    }
    
    // ... (code to reset the dashboard) ...
}
};