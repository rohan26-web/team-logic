<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FocusAI Interactive Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom Styling for elements not easily done with simple Tailwind */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* Customizing the Focus Score Circle */
        .focus-circle-container {
            position: relative;
            width: 70px;
            height: 70px;
        }
        .focus-circle-progress {
            stroke-dasharray: 219.91; /* Circumference of a 35px radius circle (2 * PI * 35) */
            stroke-dashoffset: 0;
            transition: stroke-dashoffset 0.5s ease;
            transform: rotate(-90deg);
            transform-origin: 50% 50%;
        }

        /* Specific offset for 92% (100% - 92% = 8%, 219.91 * 0.08 ≈ 17.6) */
        .progress-92 {
            stroke-dashoffset: 17.6;
        }

        /* Custom Clip-Path for the Productivity Graph (Approximation) */
        .focus-graph {
            clip-path: polygon(0 100%, 10% 80%, 30% 90%, 50% 60%, 70% 70%, 90% 40%, 100% 50%, 100% 100%);
        }

        /* Icons (to replace placeholder text) - using simple visual cues */
        .icon-gear::before { content: "⚙"; }
        .icon-up-arrow::before { content: "↗"; }
        .icon-next::before { content: "›"; }
        .icon-brain::before { content: "🧠"; }
        .icon-pause::before { content: "⏸"; }
    </style>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen p-4">

<div class="dashboard-container bg-white rounded-3xl shadow-xl p-8 max-w-5xl w-full">
    
    <header class="flex justify-between items-center mb-6">
        <div class="flex items-center text-3xl font-bold text-gray-800">
            <span class="icon-brain text-green-600 text-3xl mr-2"></span> FocusAI
        </div>
        <div class="flex items-center space-x-4">
            <img src="https://picsum.photos/40/40" alt="User Avatar" class="w-10 h-10 rounded-full border-2 border-gray-200">
            <span class="icon-gear text-xl text-gray-500 cursor-pointer"></span>
        </div>
    </header>

    <div class="flex flex-col lg:flex-row gap-6">
        
        <div class="flex-1 min-w-0">
            <div class="relative rounded-xl overflow-hidden shadow-lg aspect-video">
                <img src="https://picsum.photos/800/500?random=1" alt="User focusing" class="w-full h-full object-cover">
                
                <div class="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-lg font-medium">
                    Current Session: <span id="timer-display">01:12:45</span>
                </div>
            </div>

            <div class="flex justify-end gap-3 mt-4">
                <button id="end-session-btn-bottom" class="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition hidden lg:block">End Session</button>
                <button id="pause-btn-bottom" class="px-5 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition">Pause</button>
                <button id="break-btn-bottom" class="flex items-center px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition">
                    Take a 5-Min Break <span class="icon-gear ml-2 text-sm"></span>
                </button>
            </div>
        </div>

        <div class="w-full lg:w-80 flex flex-col space-y-6">
            <div class="bg-white p-6 rounded-xl border border-green-100 shadow-md">
                <h2 class="text-2xl font-bold text-green-700 mb-2">Excellent Focus!</h2>
                <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
                    Distractions This Session: <span id="distractions-count">0</span> <span class="icon-up-arrow text-green-500 ml-1"></span>
                </div>

                <div class="flex items-center mb-6">
                    <div class="focus-circle-container mr-4">
                        <svg viewBox="0 0 76 76" class="w-[76px] h-[76px]">
                            <circle cx="38" cy="38" r="35" fill="none" stroke="#e0e0e0" stroke-width="6"></circle>
                            <circle cx="38" cy="38" r="35" fill="none" stroke="#4CAF50" stroke-width="6" class="focus-circle-progress progress-92"></circle>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center text-green-700 font-bold">
                            <span class="text-xs absolute top-2 left-2 text-green-500">95<span class="text-xs">^</span></span>
                            <span class="text-xl">95</span>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">Focus Score: 92%</h3>
                        <p class="text-sm text-gray-500">95%</p>
                    </div>
                </div>

                <button id="end-session-btn-primary" class="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition shadow-lg shadow-green-200">
                    End Session
                </button>
            </div>
            
        </div>
    </div>

    <div class="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-6">
        
        <div class="daily-focus-trend flex-1 min-w-0">
            <h4 class="text-lg font-semibold text-gray-800 mb-1">Productivity Overview</h4>
            <p class="text-sm text-gray-500 mb-2">Daily Focus Trend</p>
            <div class="relative bg-green-50 p-2 rounded-lg h-24 overflow-hidden">
                <div class="focus-graph absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-green-300 to-green-500 opacity-70"></div>
            </div>
            <a href="#" class="text-xs text-blue-500 mt-2 block">See Daily Facelits ></a>
        </div>

        <div class="next-break sm:border-l sm:pl-6 border-gray-200 w-full sm:w-auto">
            <h4 class="text-lg font-semibold text-gray-800">Next Break In:</h4>
            <div class="flex justify-start sm:justify-end items-center text-4xl font-semibold text-gray-800 mt-1">
                <span id="next-break-time">17:30</span>
                <span class="icon-next text-gray-400 text-3xl ml-2"></span>
            </div>
        </div>
    </div>
</div>

<script>
    // --- JAVASCRIPT FOR INTERACTIVITY ---

    const timerDisplay = document.getElementById('timer-display');
    const pauseBtn = document.getElementById('pause-btn-bottom');
    const endBtns = [document.getElementById('end-session-btn-primary'), document.getElementById('end-session-btn-bottom')];
    const breakBtn = document.getElementById('break-btn-bottom');

    let isPaused = false;
    let totalSeconds = 72 * 60 + 45; // Starting time: 01:12:45
    let intervalId;

    // --- Timer Functionality ---

    function formatTime(sec) {
        const hours = String(Math.floor(sec / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const seconds = String(sec % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function startTimer() {
        if (intervalId) clearInterval(intervalId);

        intervalId = setInterval(() => {
            if (!isPaused) {
                totalSeconds++;
                timerDisplay.textContent = formatTime(totalSeconds);
            }
        }, 1000);
    }

    // --- Button Event Listeners ---

    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            pauseBtn.innerHTML = 'Resume';
            pauseBtn.classList.remove('bg-yellow-500');
            pauseBtn.classList.add('bg-green-500');
            console.log('Session Paused');
        } else {
            pauseBtn.innerHTML = 'Pause';
            pauseBtn.classList.remove('bg-green-500');
            pauseBtn.classList.add('bg-yellow-500');
            console.log('Session Resumed');
        }
    });

    endBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (intervalId) clearInterval(intervalId);
            timerDisplay.textContent = formatTime(totalSeconds) + " (ENDED)";
            alert('Session Ended! Total Time: ' + formatTime(totalSeconds));
            console.log('Session Ended');
            // Disable buttons after session ends
            pauseBtn.disabled = true;
            breakBtn.disabled = true;
            endBtns.forEach(b => b.disabled = true);
        });
    });

    breakBtn.addEventListener('click', () => {
        isPaused = true;
        pauseBtn.innerHTML = 'Resume';
        pauseBtn.classList.remove('bg-yellow-500');
        pauseBtn.classList.add('bg-green-500');
        
        let breakTime = 5 * 60;
        alert('Taking a 5-minute break! Timer paused.');
        
        // Simple break countdown (optional, for a full app)
        const breakInterval = setInterval(() => {
            breakTime--;
            console.log('Break remaining: ' + formatTime(breakTime));
            if (breakTime <= 0) {
                clearInterval(breakInterval);
                alert("Break is over! Resume focusing.");
                // User must manually click 'Resume'
            }
        }, 1000);

        console.log('5-Min Break Started');
    });

    // Initialize the timer on page load
    startTimer();
</script>

</body>
</html>
