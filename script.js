// script.js
document.addEventListener('DOMContentLoaded', () => {
    const App = {
        // --- DOM Elements ---
        elements: {
            // Screens
            welcomeScreen: document.getElementById('welcomeScreen'),
            registrationScreen: document.getElementById('registrationScreen'),
            baselineScreen: document.getElementById('baselineScreen'),
            dashboardScreen: document.getElementById('dashboardScreen'),
            // Buttons
            startChallengeBtn: document.getElementById('startChallengeBtn'),
            continueChallengeBtn: document.getElementById('continueChallengeBtn'),
            motivateMeBtn: document.getElementById('motivateMeBtn'),
            completeDayBtn: document.getElementById('completeDayBtn'),
            // Forms
            registrationForm: document.getElementById('registrationForm'),
            baselineForm: document.getElementById('baselineForm'),
            // Dashboard Display
            dashboardTitle: document.getElementById('dashboardTitle'),
            currentWeekDisplay: document.getElementById('currentWeekDisplay'),
            challengeProgress: document.getElementById('challengeProgress'),
            dailyTasksContainer: document.getElementById('dailyTasksContainer'),
            dailyCompletionMessage: document.getElementById('dailyCompletionMessage'),
            userNameDisplay: document.getElementById('userNameDisplay'),
            userPointsDisplay: document.getElementById('userPointsDisplay'),
            // Modals
            motivateModal: document.getElementById('motivateModal'),
            motivationAreaSelect: document.getElementById('motivationAreaSelect'),
            getMotivationBtn: document.getElementById('getMotivationBtn'),
            motivationMessage: document.getElementById('motivationMessage'),
            llmChatModal: document.getElementById('llmChatModal'),
            llmChatInput: document.getElementById('llmChatInput'),
            sendToLlmBtn: document.getElementById('sendToLlmBtn'),
            llmChatResponse: document.getElementById('llmChatResponse'),
            educationModal: document.getElementById('educationModal'),
            educationTitle: document.getElementById('educationTitle'),
            educationText: document.getElementById('educationText'),
            // Notifications
            inAppNotification: document.getElementById('inAppNotification'),
            inAppNotificationText: document.getElementById('inAppNotificationText'),
            dismissNotificationBtn: document.getElementById('dismissNotificationBtn'),
            // Footer
            currentYear: document.getElementById('currentYear'),
        },

        // --- App State & Data ---
        state: {
            currentScreen: 'welcome', // welcome, registration, baseline, dashboard
            userData: null, // Will hold all user specific data
            currentChallengeWeek: 1,
            totalChallengeWeeks: 10,
            today: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            isDayCompleted: false,
        },

        // --- Constants ---
        DB_KEY: 'bodyAndSoulAppUser',
        LLM_CHAT_API_ENDPOINT: 'https://api.example.com/llm-chat', // Hypothetical
        MOTIVATION_API_ENDPOINT: 'https://api.example.com/motivate', // Hypothetical

        // --- Initialization ---
        init() {
            console.log("App Initializing...");
            this.registerServiceWorker();
            this.loadData();
            this.setupEventListeners();
            this.updateFooterYear();

            if (this.state.userData && this.state.userData.isRegistered && this.state.userData.hasCompletedBaseline) {
                this.elements.continueChallengeBtn.classList.remove('hidden');
                this.elements.startChallengeBtn.textContent = 'Start Over'; // Or hide start if continue exists
                this.navigateTo('dashboard'); // Or check last active date
                this.checkForMissedDays();
            } else if (this.state.userData && this.state.userData.isRegistered) {
                this.navigateTo('baseline');
            } else {
                this.navigateTo('welcome');
            }
            this.updateUserDisplay();
            this.requestNotificationPermission();
        },

        updateFooterYear() {
            if (this.elements.currentYear) {
                this.elements.currentYear.textContent = new Date().getFullYear();
            }
        },

        // --- PWA & Notifications ---
        registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('Service Worker registered with scope:', registration.scope))
                    .catch(error => console.error('Service Worker registration failed:', error));
            }
        },

        requestNotificationPermission() {
            if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.showInAppNotification("Notifications enabled! We'll send reminders.", 'success', 5000);
                    } else {
                        this.showInAppNotification("Notifications permission denied. You can manage this in browser settings.", 'error', 7000);
                    }
                });
            } else if (Notification.permission === 'denied') {
                 this.showInAppNotification("Notifications are currently disabled. Check browser settings to enable them for reminders.", 'info', 7000);
            }
        },

        sendNotification(title, body) {
            if ('Notification' in window && Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        body: body,
                        icon: 'icons/icon-192x192.png', // Ensure this icon exists
                        badge: 'icons/icon-72x72.png' // For Android
                    });
                });
            } else {
                // Fallback to in-app notification if permission not granted or API not available
                this.showInAppNotification(`${title}: ${body}`, 'info', 10000);
                console.warn("Browser notifications not available or permission denied. Showing in-app.");
            }
        },

        showInAppNotification(message, type = 'info', duration = 5000) {
            this.elements.inAppNotificationText.textContent = message;
            this.elements.inAppNotification.classList.remove('hidden', 'success', 'error', 'info');
            if (type) this.elements.inAppNotification.classList.add(type);

            setTimeout(() => {
                this.elements.inAppNotification.classList.add('hidden');
            }, duration);
        },

        // --- Data Management (localStorage) ---
        loadData() {
            const data = localStorage.getItem(this.DB_KEY);
            if (data) {
                this.state.userData = JSON.parse(data);
                // Ensure nested objects/arrays exist if new features were added
                this.state.userData.dailyLogs = this.state.userData.dailyLogs || {};
                this.state.userData.points = this.state.userData.points || 0;
                this.state.userData.badges = this.state.userData.badges || [];
                this.state.userData.makeMeQuit = this.state.userData.makeMeQuit || {
                    behavior: null,
                    trigger: null,
                    substitution: null,
                    log: {}
                };
                this.state.userData.peaceOfMind = this.state.userData.peaceOfMind || {
                    moodStressLog: {}, // { date: { preMood, preStress, postMood, postStress } }
                    gratitudeLog: {} // { weekX: "entry" }
                };

                this.state.currentChallengeWeek = this.state.userData.currentChallengeWeek || 1;

                // Check if today's data exists for completion status
                const todayLog = this.state.userData.dailyLogs[this.state.today];
                this.state.isDayCompleted = todayLog ? todayLog.dayCompleted || false : false;

            } else {
                this.state.userData = this.getDefaultUserData();
            }
        },

        saveData() {
            try {
                localStorage.setItem(this.DB_KEY, JSON.stringify(this.state.userData));
                this.updateUserDisplay(); // Update points display on save
            } catch (e) {
                console.error("Error saving data to localStorage:", e);
                this.showInAppNotification("Could not save progress. Your browser storage might be full.", "error");
            }
        },

        getDefaultUserData() {
            return {
                name: '',
                age: null,
                gender: '',
                initialWeight: null,
                currentWeight: null, // Can be updated weekly or as user inputs
                height: null,
                idealWeight: null,
                caloricDeficitTarget: null,
                baselineCardio: '',
                baselineStrength: '',
                exerciseTrack: 'beginner', // Default
                isRegistered: false,
                hasCompletedBaseline: false,
                startDate: null,
                currentChallengeWeek: 1,
                lastLoginDate: this.state.today,
                dailyLogs: {}, // { 'YYYY-MM-DD': { sleep: {}, weightControl: {}, exerciseCompleted: false, ... } }
                points: 0,
                badges: [], // e.g., ['Week 1 Complete', 'First 100 Points']
                makeMeQuit: {
                    behavior: null, // Set in W1
                    trigger: null, // Set in W2
                    substitution: null, // Set in W4
                    log: {} // { 'YYYY-MM-DD': { instances: N, context: "text" } }
                },
                peaceOfMind: {
                    moodStressLog: {},
                    gratitudeLog: {}
                }
            };
        },

        updateUserDisplay() {
            if (this.state.userData && this.state.userData.name) {
                this.elements.userNameDisplay.textContent = `Hi, ${this.state.userData.name}!`;
            } else {
                this.elements.userNameDisplay.textContent = '';
            }
            this.elements.userPointsDisplay.textContent = `${this.state.userData.points || 0}`;
        },

        // --- Navigation ---
        navigateTo(screenName) {
            ['welcomeScreen', 'registrationScreen', 'baselineScreen', 'dashboardScreen'].forEach(id => {
                this.elements[id].classList.add('hidden');
            });
            if (this.elements[screenName + 'Screen']) {
                this.elements[screenName + 'Screen'].classList.remove('hidden');
                this.state.currentScreen = screenName;
            } else {
                console.error("Screen not found:", screenName);
                this.elements.welcomeScreen.classList.remove('hidden'); // Fallback
                this.state.currentScreen = 'welcome';
            }

            if (screenName === 'dashboard') {
                this.renderDashboard();
            }
        },

        // --- Event Listeners Setup ---
        setupEventListeners() {
            this.elements.startChallengeBtn.addEventListener('click', () => {
                if (this.state.userData && this.state.userData.isRegistered && this.state.userData.hasCompletedBaseline) {
                    // "Start Over" logic
                    if (confirm("Are you sure you want to start over? All progress will be lost.")) {
                        this.state.userData = this.getDefaultUserData();
                        this.saveData();
                        this.navigateTo('registration');
                    }
                } else {
                    this.navigateTo('registration');
                }
            });

            this.elements.continueChallengeBtn.addEventListener('click', () => this.navigateTo('dashboard'));

            this.elements.registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });

            this.elements.baselineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBaseline();
            });

            this.elements.motivateMeBtn.addEventListener('click', () => this.showModal('motivateModal'));
            this.elements.getMotivationBtn.addEventListener('click', () => this.handleGetMotivation());

            this.elements.sendToLlmBtn.addEventListener('click', () => this.handleLlmChatSend());

            // Modal close buttons
            document.querySelectorAll('.close-button').forEach(btn => {
                btn.addEventListener('click', (e) => this.closeModal(e.target.dataset.targetModal));
            });
            // Close modal on outside click
            window.addEventListener('click', (event) => {
                 if (event.target.classList.contains('modal')) {
                    this.closeModal(event.target.id);
                }
            });

            this.elements.completeDayBtn.addEventListener('click', () => this.handleCompleteDay());
            this.elements.dismissNotificationBtn.addEventListener('click', () => this.elements.inAppNotification.classList.add('hidden'));
        },


        // --- User Workflow Handlers ---
        handleRegistration() {
            const name = document.getElementById('name').value.trim();
            const age = parseInt(document.getElementById('age').value);
            const gender = document.getElementById('gender').value;
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseInt(document.getElementById('height').value);

            if (!name || isNaN(age) || !gender || isNaN(weight) || isNaN(height)) {
                this.showInAppNotification("Please fill all fields correctly.", "error");
                return;
            }

            this.state.userData.name = name;
            this.state.userData.age = age;
            this.state.userData.gender = gender;
            this.state.userData.initialWeight = weight;
            this.state.userData.currentWeight = weight;
            this.state.userData.height = height;
            this.state.userData.isRegistered = true;
            this.state.userData.startDate = this.state.today;
            this.state.userData.lastLoginDate = this.state.today;

            // Calculate Ideal Weight (Simplified BMI target of 22.5)
            const heightInMeters = height / 100;
            this.state.userData.idealWeight = (22.5 * Math.pow(heightInMeters, 2)).toFixed(1);
            // Simplified Caloric Deficit (target 0.5kg/week loss = approx 500kcal/day deficit)
            this.state.userData.caloricDeficitTarget = 500; // kcal

            this.saveData();
            this.navigateTo('baseline');
        },

        handleBaseline() {
            const cardio = document.getElementById('cardioCapacity').value.trim();
            const strength = document.getElementById('strengthReps').value.trim();
            const track = document.getElementById('exerciseTrack').value;

            if (!cardio || !strength || !track) {
                this.showInAppNotification("Please fill all baseline fields.", "error");
                return;
            }

            this.state.userData.baselineCardio = cardio;
            this.state.userData.baselineStrength = strength;
            this.state.userData.exerciseTrack = track;
            this.state.userData.hasCompletedBaseline = true;
            this.state.userData.currentChallengeWeek = 1; // Start challenge

            this.saveData();
            this.addPoints(20, "Baseline Complete"); // Gamification
            this.navigateTo('dashboard');
        },

        // --- Dashboard Rendering & Task Logic ---
        renderDashboard() {
            if (!this.state.userData || !this.state.userData.isRegistered || !this.state.userData.hasCompletedBaseline) {
                this.navigateTo('welcome'); // Should not happen if logic is correct
                return;
            }
            this.updateCurrentWeek(); // Ensure week is current
            this.elements.currentWeekDisplay.textContent = this.state.currentChallengeWeek;
            this.elements.challengeProgress.value = (this.state.currentChallengeWeek / this.state.totalChallengeWeeks) * 100;
            this.elements.dailyTasksContainer.innerHTML = ''; // Clear previous tasks

            this.renderSleepTask();
            this.renderWeightControlTask();
            this.renderExerciseTask();
            this.renderPeaceOfMindTask();
            this.renderMakeMeQuitTask();

            this.checkDayCompletionStatus();
        },

        updateCurrentWeek() {
            if (!this.state.userData.startDate) return;
            const startDate = new Date(this.state.userData.startDate);
            const todayDate = new Date(this.state.today);
            const diffTime = Math.abs(todayDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let currentWeek = Math.floor(diffDays / 7) + 1;
            currentWeek = Math.min(currentWeek, this.state.totalChallengeWeeks); // Cap at max weeks
            this.state.currentChallengeWeek = currentWeek;
            this.state.userData.currentChallengeWeek = currentWeek; // Persist this
            // this.saveData(); // Avoid saving too frequently here, save with other actions
        },

        // --- Individual Task Rendering Functions ---
        // Each function should:
        // 1. Create HTML for the task card.
        // 2. Populate with current week's logic.
        // 3. Load any saved data for today.
        // 4. Add event listeners for inputs/checkboxes to save data.

        getTodayLog(createIfNotExist = false) {
            if (!this.state.userData.dailyLogs[this.state.today] && createIfNotExist) {
                this.state.userData.dailyLogs[this.state.today] = {
                    // Initialize structure for a new day's log
                    sleep: { bedtime: '', waketime: '', targetMet: null, duration: null },
                    weightControl: {
                        mealtimes: '', water: '', food: '', nonWaterDrinks: '',
                        junkFoodStopped: false, fruitSnacks: false, mealTimesAdhered: false,
                        caloriesTracked: null
                    },
                    exerciseCompleted: false,
                    peaceOfMind: {
                        mindfulnessCompleted: false,
                        moodBefore: null, stressBefore: null, moodAfter: null, stressAfter: null,
                        breathingCompleted: false, enjoyableActivityCompleted: false
                    },
                    makeMeQuit: {
                        instancesLogged: null, contextLogged: '', triggerAvoided: false, substitutionPracticed: false
                    },
                    tasksCompleted: {}, // Tracks individual sub-tasks completion
                    dayCompleted: false
                };
            }
            return this.state.userData.dailyLogs[this.state.today];
        },

        renderSleepTask() {
            const W = this.state.currentChallengeWeek;
            const todayLog = this.getTodayLog(true).sleep;
            let content = `<h3><input type="checkbox" id="sleepTaskDone" data-task="sleep"> Sleep</h3>`;

            if (W === 1) {
                content += `<div class="task-input-group">
                                <label for="bedtime">Bedtime:</label>
                                <input type="time" id="bedtime" value="${todayLog.bedtime || ''}">
                            </div>
                            <div class="task-input-group">
                                <label for="waketime">Wake-up Time:</label>
                                <input type="time" id="waketime" value="${todayLog.waketime || ''}">
                            </div>`;
            } else { // Weeks 2-10
                const targetBedtime = this.state.userData.sleepTargetBedtime || "22:30"; // Example default
                const targetWaketime = this.state.userData.sleepTargetWaketime || "06:30";
                content += `<p>Target: Bed by ${targetBedtime}, Awake by ${targetWaketime}</p>
                            <div class="task-input-group">
                                <label for="bedtime">Actual Bedtime:</label>
                                <input type="time" id="bedtime" value="${todayLog.bedtime || ''}">
                            </div>
                            <div class="task-input-group">
                                <label for="waketime">Actual Wake-up Time:</label>
                                <input type="time" id="waketime" value="${todayLog.waketime || ''}">
                            </div>
                            <div id="sleepTargetStatus" class="task-display">Status: ${todayLog.targetMet === null ? 'Enter times' : (todayLog.targetMet ? 'Goal Met!' : 'Goal Missed')}</div>`;
            }
            content += `<div id="sleepDurationDisplay" class="task-display">Total Sleep: ${todayLog.duration || 'N/A'}</div>`;

            this.addCardToDashboard('sleep-task', content);

            document.getElementById('bedtime').addEventListener('change', (e) => this.updateSleepData('bedtime', e.target.value));
            document.getElementById('waketime').addEventListener('change', (e) => this.updateSleepData('waketime', e.target.value));
            this.updateTaskCheckboxState('sleep');
        },

        updateSleepData(field, value) {
            const todayLog = this.getTodayLog().sleep;
            todayLog[field] = value;

            if (todayLog.bedtime && todayLog.waketime) {
                const bedtimeDate = new Date(`2000-01-01T${todayLog.bedtime}`);
                let waketimeDate = new Date(`2000-01-01T${todayLog.waketime}`);

                if (waketimeDate < bedtimeDate) { // Woke up next day
                    waketimeDate.setDate(waketimeDate.getDate() + 1);
                }
                const diffMs = waketimeDate - bedtimeDate;
                const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(1);
                todayLog.duration = `${diffHours} hours`;
                document.getElementById('sleepDurationDisplay').textContent = `Total Sleep: ${todayLog.duration}`;

                if (this.state.currentChallengeWeek > 1) {
                    const targetBed = this.state.userData.sleepTargetBedtime || "22:30";
                    const targetWake = this.state.userData.sleepTargetWaketime || "06:30";
                    
                    // Simplified check: within 30 mins (in a real app, use a robust time diff library)
                    const bedDiff = Math.abs(new Date(`2000-01-01T${todayLog.bedtime}`) - new Date(`2000-01-01T${targetBed}`)) / (1000*60);
                    const wakeDiff = Math.abs(new Date(`2000-01-01T${todayLog.waketime}`) - new Date(`2000-01-01T${targetWake}`)) / (1000*60);
                    
                    todayLog.targetMet = bedDiff <= 30 && wakeDiff <= 30;
                    document.getElementById('sleepTargetStatus').textContent = `Status: ${todayLog.targetMet ? 'Goal Met!' : 'Goal Missed'}`;
                    if(todayLog.targetMet) this.addPoints(2, "Sleep Target Met");
                }
            }
            this.saveData();
            this.checkTaskCompletion('sleep', !!(todayLog.bedtime && todayLog.waketime));
        },

        renderWeightControlTask() {
            const W = this.state.currentChallengeWeek;
            const todayLog = this.getTodayLog(true).weightControl;
            const userData = this.state.userData;
            let content = `<h3><input type="checkbox" id="weightControlTaskDone" data-task="weightControl"> Weight Control</h3>`;

            if (W === 1) {
                content += `<p>Ideal weight: ${userData.idealWeight} kg. Target deficit: ${userData.caloricDeficitTarget} kcal/day.</p>
                            <div class="task-input-group"><label for="wcMealTimes">Log Mealtimes:</label><input type="text" id="wcMealTimes" placeholder="e.g., 8am, 1pm, 6pm" value="${todayLog.mealtimes || ''}"></div>
                            <div class="task-input-group"><label for="wcWater">Water Intake (liters):</label><input type="number" step="0.1" id="wcWater" placeholder="e.g., 2.5" value="${todayLog.water || ''}"></div>
                            <div class="task-input-group"><label for="wcFood">Main Food Eaten (briefly):</label><textarea id="wcFood" rows="2" placeholder="e.g., Oats, Chicken salad, Fish & veg">${todayLog.food || ''}</textarea></div>
                            <div class="task-input-group"><label for="wcNonWaterDrinks">Non-water drinks:</label><input type="text" id="wcNonWaterDrinks" placeholder="e.g., 1 coffee, 1 soda" value="${todayLog.nonWaterDrinks || ''}"></div>`;
            } else if (W === 2) {
                content += `<p>Continue tracking. Focus on stopping non-water drinks/junk, fruit for snacks, set meal times.</p>
                            ${this.renderWeightControlTaskInputs(todayLog)} <!-- Re-use inputs from W1 -->
                            <div class="task-item"><input type="checkbox" id="wcJunkFood" ${todayLog.junkFoodStopped ? 'checked' : ''}> Stop non-water/junk food.</div>
                            <div class="task-item"><input type="checkbox" id="wcFruitSnacks" ${todayLog.fruitSnacks ? 'checked' : ''}> Replace snacks with fruits.</div>
                            <div class="task-item"><input type="checkbox" id="wcMealTimesAdhered" ${todayLog.mealTimesAdhered ? 'checked' : ''}> Adhere to set meal times (Breakfast, Lunch, Early Dinner, Late Snack).</div>`;
            } else { // Weeks 3-10
                content += `<p>Continue tracking. Reduce caloric intake to maintain ${userData.caloricDeficitTarget} kcal deficit.</p>
                            ${this.renderWeightControlTaskInputs(todayLog)}
                            <div class="task-input-group"><label for="wcCalories">Estimated Caloric Intake:</label><input type="number" id="wcCalories" placeholder="e.g., 1800" value="${todayLog.caloriesTracked || ''}"></div>
                            <p class="task-display">Your daily calorie goal (approx): ${this.calculateDailyCalorieGoal()} kcal</p>`;
            }

            this.addCardToDashboard('weight-control-task', content);

            // Event Listeners for W1 common inputs
            document.getElementById('wcMealTimes')?.addEventListener('input', (e) => this.updateWeightLog('mealtimes', e.target.value));
            document.getElementById('wcWater')?.addEventListener('input', (e) => this.updateWeightLog('water', e.target.value));
            document.getElementById('wcFood')?.addEventListener('input', (e) => this.updateWeightLog('food', e.target.value));
            document.getElementById('wcNonWaterDrinks')?.addEventListener('input', (e) => this.updateWeightLog('nonWaterDrinks', e.target.value));

            // Event Listeners for W2 specifics
            document.getElementById('wcJunkFood')?.addEventListener('change', (e) => this.updateWeightLog('junkFoodStopped', e.target.checked, 2));
            document.getElementById('wcFruitSnacks')?.addEventListener('change', (e) => this.updateWeightLog('fruitSnacks', e.target.checked, 2));
            document.getElementById('wcMealTimesAdhered')?.addEventListener('change', (e) => this.updateWeightLog('mealTimesAdhered', e.target.checked, 2));
            
            // Event Listener for W3+ specifics
            document.getElementById('wcCalories')?.addEventListener('input', (e) => this.updateWeightLog('caloriesTracked', e.target.value, 5));
             this.updateTaskCheckboxState('weightControl');
        },

        renderWeightControlTaskInputs(todayLog) { // Helper for W2+
            return `<div class="task-input-group"><label for="wcMealTimes">Log Mealtimes:</label><input type="text" id="wcMealTimes" value="${todayLog.mealtimes || ''}"></div>
                    <div class="task-input-group"><label for="wcWater">Water Intake (L):</label><input type="number" step="0.1" id="wcWater" value="${todayLog.water || ''}"></div>
                    <div class="task-input-group"><label for="wcFood">Main Food Eaten:</label><textarea id="wcFood" rows="2">${todayLog.food || ''}</textarea></div>
                    <div class="task-input-group"><label for="wcNonWaterDrinks">Non-water drinks:</label><input type="text" id="wcNonWaterDrinks" value="${todayLog.nonWaterDrinks || ''}"></div>`;
        },
        
        calculateDailyCalorieGoal() {
            // Placeholder: In a real app, this would use BMR (Harris-Benedict/Mifflin-St Jeor) - activity level - deficit
            // For simplicity, assume a generic BMR + activity.
            // This is highly simplified and not medically accurate.
            const baseMaintenance = this.state.userData.gender === 'female' ? 1800 : 2200; // Very rough estimate
            return baseMaintenance - (this.state.userData.caloricDeficitTarget || 500);
        },

        updateWeightLog(field, value, points = 1) {
            const todayLog = this.getTodayLog().weightControl;
            todayLog[field] = value;
            if (value === true || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && !isNaN(value))) {
                this.addPoints(points, `Weight Control: ${field}`);
            }
            this.saveData();
            this.checkTaskCompletion('weightControl', this.isWeightControlTaskSubstantiallyFilled());
        },

        isWeightControlTaskSubstantiallyFilled() {
            const W = this.state.currentChallengeWeek;
            const log = this.getTodayLog().weightControl;
            if (W === 1) return log.mealtimes && log.water && log.food;
            if (W === 2) return log.mealtimes && log.water && log.food && log.junkFoodStopped && log.fruitSnacks && log.mealTimesAdhered;
            return log.mealtimes && log.water && log.food && log.caloriesTracked;
        },

        renderExerciseTask() {
            const W = this.state.currentChallengeWeek;
            const todayLog = this.getTodayLog(true);
            const track = this.state.userData.exerciseTrack;
            let routine = this.getExerciseRoutine(W, track, this.state.userData.gender, this.state.userData.age);

            let content = `<h3><input type="checkbox" id="exerciseTaskDone" data-task="exercise" ${todayLog.exerciseCompleted ? 'checked' : ''}> Exercise</h3>
                           <p>Your Track: ${track.charAt(0).toUpperCase() + track.slice(1)}</p>
                           <h4>Cardio:</h4>
                           <p>${routine.cardio}</p>
                           <h4>Strength:</h4>
                           <p>${routine.strength}</p>
                           <div class="task-item"><input type="checkbox" id="exerciseCompletedCheck" ${todayLog.exerciseCompleted ? 'checked' : ''}> Mark as completed</div>`;

            this.addCardToDashboard('exercise-task', content);
            document.getElementById('exerciseCompletedCheck').addEventListener('change', (e) => {
                todayLog.exerciseCompleted = e.target.checked;
                if(e.target.checked) this.addPoints(10, "Exercise Completed");
                this.saveData();
                this.checkTaskCompletion('exercise', e.target.checked);
            });
            this.updateTaskCheckboxState('exercise', todayLog.exerciseCompleted); // Pass completed status
        },

        getExerciseRoutine(week, track, gender, age) {
            // Simplified escalating routine. This needs significant expansion for a real app.
            // Base values (very generic)
            let baseCardioMins = 15;
            let baseStrengthSets = "2 sets of 10-12 reps (e.g., bodyweight squats, push-ups variation, planks)";

            // Track multiplier
            let trackMultiplier = 1.0;
            if (track === 'intermediate') trackMultiplier = 1.2;
            if (track === 'advanced') trackMultiplier = 1.5;

            // Weekly escalation (simple linear increase)
            let cardioMins = Math.round(baseCardioMins * trackMultiplier + (week - 1) * 2 * trackMultiplier);
            cardioMins = Math.min(cardioMins, 60); // Cap cardio

            let strengthDesc = baseStrengthSets;
            if (week > 3) strengthDesc = strengthDesc.replace("2 sets", "3 sets");
            if (week > 6) strengthDesc = strengthDesc.replace("10-12 reps", "12-15 reps or harder variations");
            
            // Minimal age/gender adjustment (very coarse)
            // if (age > 50) cardioMins = Math.max(10, cardioMins - 5);
            // if (gender === 'female' && track === 'beginner') strengthDesc = strengthDesc.replace("push-ups", "knee push-ups / wall push-ups");

            return {
                cardio: `${cardioMins} minutes of moderate intensity (e.g., brisk walk, jog, cycle).`,
                strength: strengthDesc
            };
        },

        renderPeaceOfMindTask() {
            const W = this.state.currentChallengeWeek;
            const todayLogPOM = this.getTodayLog(true).peaceOfMind;
            let content = `<h3><input type="checkbox" id="peaceOfMindTaskDone" data-task="peaceOfMind"> Peace of Mind</h3>`;
            
            content += `<div class="task-item">
                            <input type="checkbox" id="pomMindfulness" ${todayLogPOM.mindfulnessCompleted ? 'checked' : ''}> 1-min Mindfulness. 
                            <button class="btn btn-small" id="startMindfulnessTimerBtn">Start Timer</button>
                            <span id="mindfulnessTimerDisplay"></span>
                        </div>`;
            content += `<div><label>Mood (1-10):</label> Before: <input type="number" min="1" max="10" id="pomMoodBefore" class="small-input" value="${todayLogPOM.moodBefore || ''}"> After: <input type="number" min="1" max="10" id="pomMoodAfter" class="small-input" value="${todayLogPOM.moodAfter || ''}"></div>`;
            content += `<div><label>Stress (1-10):</label> Before: <input type="number" min="1" max="10" id="pomStressBefore" class="small-input" value="${todayLogPOM.stressBefore || ''}"> After: <input type="number" min="1" max="10" id="pomStressAfter" class="small-input" value="${todayLogPOM.stressAfter || ''}"></div>`;
            content += `<div class="task-item"><input type="checkbox" id="pomBreathing" ${todayLogPOM.breathingCompleted ? 'checked' : ''}> Breathing exercises (e.g., Box Breathing for 2 mins). <button class="btn btn-small" data-education="breathing">Instructions</button></div>`;
            content += `<div class="task-item">
                            Talk about stress triggers (LLM simulated chat). 
                            <button class="btn btn-small" id="openLlmChatBtn">Open Chat</button>
                        </div>`;
            content += `<div class="task-item"><input type="checkbox" id="pomEnjoyableActivity" ${todayLogPOM.enjoyableActivityCompleted ? 'checked' : ''}> 30 mins enjoyable non-harmful activity.</div>`;

            if (W >= 2) {
                const gratitudeLog = this.state.userData.peaceOfMind.gratitudeLog;
                const gratitudeKey = `week${W}`;
                content += `<hr><p><strong>Weekly Gratitude:</strong> (Once this week)</p>
                            <textarea id="pomGratitude" rows="2" placeholder="One thing you are grateful for this week...">${gratitudeLog[gratitudeKey] || ''}</textarea>`;
            }

            this.addCardToDashboard('peace-of-mind-task', content);

            // Event listeners for PoM
            document.getElementById('startMindfulnessTimerBtn').addEventListener('click', () => this.startMindfulnessTimer());
            document.getElementById('pomMindfulness').addEventListener('change', (e) => this.updatePeaceOfMindLog('mindfulnessCompleted', e.target.checked, 2));
            document.getElementById('pomMoodBefore').addEventListener('input', (e) => this.updatePeaceOfMindLog('moodBefore', e.target.value));
            document.getElementById('pomMoodAfter').addEventListener('input', (e) => this.updatePeaceOfMindLog('moodAfter', e.target.value));
            document.getElementById('pomStressBefore').addEventListener('input', (e) => this.updatePeaceOfMindLog('stressBefore', e.target.value));
            document.getElementById('pomStressAfter').addEventListener('input', (e) => this.updatePeaceOfMindLog('stressAfter', e.target.value));
            document.getElementById('pomBreathing').addEventListener('change', (e) => this.updatePeaceOfMindLog('breathingCompleted', e.target.checked, 2));
            document.getElementById('openLlmChatBtn').addEventListener('click', () => this.showModal('llmChatModal'));
            document.getElementById('pomEnjoyableActivity').addEventListener('change', (e) => this.updatePeaceOfMindLog('enjoyableActivityCompleted', e.target.checked, 3));
            
            if (document.getElementById('pomGratitude')) {
                document.getElementById('pomGratitude').addEventListener('input', (e) => this.updateGratitudeLog(e.target.value));
            }

            document.querySelector('button[data-education="breathing"]').addEventListener('click', () => {
                this.showEducationModal(
                    "Breathing Exercise: Box Breathing",
                    "Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds. Repeat for 2-5 minutes. This can help calm the nervous system."
                );
            });
            this.updateTaskCheckboxState('peaceOfMind');
        },

        startMindfulnessTimer() {
            let timeLeft = 60;
            const timerDisplay = document.getElementById('mindfulnessTimerDisplay');
            const mindfulnessCheckbox = document.getElementById('pomMindfulness');
            timerDisplay.textContent = ` ${timeLeft}s`;
            const interval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = ` ${timeLeft}s`;
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    timerDisplay.textContent = " Done!";
                    mindfulnessCheckbox.checked = true;
                    this.updatePeaceOfMindLog('mindfulnessCompleted', true, 2);
                    this.sendNotification("Mindfulness Complete!", "Great job on your 1-minute mindfulness.");
                }
            }, 1000);
        },

        updatePeaceOfMindLog(field, value, points = 1) {
            const todayLogPOM = this.getTodayLog().peaceOfMind;
            todayLogPOM[field] = value;
            if(value === true || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && !isNaN(value))) {
                if (field.endsWith('Completed') && value === true) this.addPoints(points, `Peace of Mind: ${field}`);
                else if (!field.endsWith('Completed')) this.addPoints(0.5, `Peace of Mind: ${field} logged`); // Small points for logging mood/stress
            }
            this.saveData();
            this.checkTaskCompletion('peaceOfMind', this.isPeaceOfMindTaskSubstantiallyFilled());
        },

        updateGratitudeLog(value) {
            const gratitudeLog = this.state.userData.peaceOfMind.gratitudeLog;
            const gratitudeKey = `week${this.state.currentChallengeWeek}`;
            if (!gratitudeLog[gratitudeKey] && value.trim().length > 0) { // Add points only for the first entry of the week
                this.addPoints(5, "Weekly Gratitude Logged");
            }
            gratitudeLog[gratitudeKey] = value;
            this.saveData();
        },

        isPeaceOfMindTaskSubstantiallyFilled() {
            const log = this.getTodayLog().peaceOfMind;
            // Example: mindfulness, breathing, and enjoyable activity are key
            return log.mindfulnessCompleted && log.breathingCompleted && log.enjoyableActivityCompleted && log.moodBefore && log.stressBefore && log.moodAfter && log.stressAfter;
        },


        renderMakeMeQuitTask() {
            const W = this.state.currentChallengeWeek;
            const mmqData = this.state.userData.makeMeQuit;
            const todayLogMMQ = this.getTodayLog(true).makeMeQuit;
            let content = `<h3><input type="checkbox" id="makeMeQuitTaskDone" data-task="makeMeQuit"> Make Me Quit</h3>`;

            if (!mmqData.behavior && W >= 1) { // Prompt for behavior if not set
                content += `<p>Identify one unhealthy behavior you want to change this challenge.</p>
                            <div class="task-input-group"><label for="mmqBehavior">Behavior to Quit:</label><input type="text" id="mmqBehaviorInput" placeholder="e.g., mindless snacking after 8pm"></div>`;
            } else {
                content += `<p>Focus: Modifying "<strong>${mmqData.behavior || 'Not Set'}</strong>"</p>`;
            }

            if (mmqData.behavior) { // Only show further steps if behavior is defined
                if (W === 1) {
                    content += `<p><strong>Week 1 (Awareness):</strong> Track instances and context of "${mmqData.behavior}".</p>
                                <div class="task-input-group"><label for="mmqInstances">Times it occurred today:</label><input type="number" id="mmqInstances" min="0" value="${todayLogMMQ.instancesLogged || ''}"></div>
                                <div class="task-input-group"><label for="mmqContext">Context/Notes:</label><textarea id="mmqContext" rows="2" placeholder="e.g., watching TV, felt bored">${todayLogMMQ.contextLogged || ''}</textarea></div>`;
                } else if (W === 2) {
                    if (!mmqData.trigger) {
                        content += `<p><strong>Week 2 (Identify Trigger):</strong> Based on last week, what's one specific trigger for "${mmqData.behavior}"?</p>
                                    <div class="task-input-group"><label for="mmqTriggerInput">Identify Trigger:</label><input type="text" id="mmqTriggerInput" placeholder="e.g., opening the fridge when bored"></div>`;
                    } else {
                        content += `<p>Your identified trigger: "<strong>${mmqData.trigger}</strong>". Continue logging awareness.</p>
                                    ${this.renderMMQWeek1Inputs(todayLogMMQ)} <!-- Include W1 logging -->`;
                    }
                } else if (W === 3) {
                    if (!mmqData.trigger) content += `<p>Please identify your trigger first (task from Week 2).</p>`;
                    else content += `<p><strong>Week 3 (Limit Exposure):</strong> Actively try to limit exposure to your trigger: "<strong>${mmqData.trigger}</strong>".</p>
                                    <div class="task-item"><input type="checkbox" id="mmqTriggerAvoided" ${todayLogMMQ.triggerAvoided ? 'checked' : ''}> I actively worked on limiting trigger exposure today.</div>
                                    ${this.renderMMQWeek1Inputs(todayLogMMQ)}`;
                } else { // Weeks 4-10
                    if (!mmqData.trigger) content += `<p>Please identify your trigger first (task from Week 2).</p>`;
                    else if (!mmqData.substitution) {
                         content += `<p><strong>Week 4+ (Substitution):</strong> Plan a substitution behavior for when "${mmqData.trigger}" occurs.</p>
                                    <div class="task-input-group"><label for="mmqSubstitutionInput">Substitution Behavior:</label><input type="text" id="mmqSubstitutionInput" placeholder="e.g., drink water, do 5 squats"></div>
                                    ${this.renderMMQWeek1Inputs(todayLogMMQ)}`;
                    } else {
                        content += `<p><strong>Weeks 4-10 (Practice Substitution):</strong> Practice "<strong>${mmqData.substitution}</strong>" when "${mmqData.trigger}" occurs.</p>
                                    <div class="task-item"><input type="checkbox" id="mmqSubstitutionPracticed" ${todayLogMMQ.substitutionPracticed ? 'checked' : ''}> I practiced my substitution behavior today.</div>
                                    ${this.renderMMQWeek1Inputs(todayLogMMQ)}`;
                    }
                }
            }

            this.addCardToDashboard('make-me-quit-task', content);

            // Event Listeners for MMQ
            document.getElementById('mmqBehaviorInput')?.addEventListener('change', (e) => this.updateMMQData('behavior', e.target.value));
            document.getElementById('mmqInstances')?.addEventListener('input', (e) => this.updateMMQLog('instancesLogged', parseInt(e.target.value) || 0));
            document.getElementById('mmqContext')?.addEventListener('input', (e) => this.updateMMQLog('contextLogged', e.target.value));
            document.getElementById('mmqTriggerInput')?.addEventListener('change', (e) => this.updateMMQData('trigger', e.target.value, 5));
            document.getElementById('mmqTriggerAvoided')?.addEventListener('change', (e) => this.updateMMQLog('triggerAvoided', e.target.checked, 3));
            document.getElementById('mmqSubstitutionInput')?.addEventListener('change', (e) => this.updateMMQData('substitution', e.target.value, 5));
            document.getElementById('mmqSubstitutionPracticed')?.addEventListener('change', (e) => this.updateMMQLog('substitutionPracticed', e.target.checked, 3));
            this.updateTaskCheckboxState('makeMeQuit');
        },

        renderMMQWeek1Inputs(todayLogMMQ) {
            return `<div class="task-input-group"><label for="mmqInstances">Times it occurred today:</label><input type="number" id="mmqInstances" min="0" value="${todayLogMMQ.instancesLogged || ''}"></div>
                    <div class="task-input-group"><label for="mmqContext">Context/Notes:</label><textarea id="mmqContext" rows="2">${todayLogMMQ.contextLogged || ''}</textarea></div>`;
        },

        updateMMQData(field, value, points = 0) { // For behavior, trigger, substitution
            this.state.userData.makeMeQuit[field] = value;
            if (value.trim().length > 0 && points > 0) this.addPoints(points, `MakeMeQuit: ${field} set`);
            this.saveData();
            this.renderDashboard(); // Re-render to show updated info
        },

        updateMMQLog(field, value, points = 1) { // For daily log items
            const todayLogMMQ = this.getTodayLog().makeMeQuit;
            todayLogMMQ[field] = value;
            if ((value === true) || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && value >=0)) {
                 if (field.endsWith('Practiced') && value === true) this.addPoints(points, `MakeMeQuit: ${field}`);
                 else if (field.endsWith('Avoided') && value === true) this.addPoints(points, `MakeMeQuit: ${field}`);
                 else if (field.includes('Logged')) this.addPoints(points, `MakeMeQuit: Logged`);
            }
            this.saveData();
            this.checkTaskCompletion('makeMeQuit', this.isMakeMeQuitTaskSubstantiallyFilled());
        },

        isMakeMeQuitTaskSubstantiallyFilled() {
            const W = this.state.currentChallengeWeek;
            const log = this.getTodayLog().makeMeQuit;
            const data = this.state.userData.makeMeQuit;

            if (!data.behavior) return false; // Must have behavior defined
            if (W === 1) return typeof log.instancesLogged === 'number' && log.contextLogged !== undefined;
            if (W === 2) return data.trigger && typeof log.instancesLogged === 'number'; // Check if trigger defined
            if (W === 3) return data.trigger && log.triggerAvoided;
            if (W >= 4) return data.trigger && data.substitution && log.substitutionPracticed;
            return false;
        },

        // --- Task Card Helper ---
        addCardToDashboard(id, innerHTML) {
            const card = document.createElement('div');
            card.id = id;
            card.className = 'task-card';
            card.innerHTML = innerHTML;
            this.elements.dailyTasksContainer.appendChild(card);
        },

        // --- Task Completion Logic & Gamification ---
        checkTaskCompletion(taskKey, isSubstantiallyFilled) {
            const todayLog = this.getTodayLog();
            todayLog.tasksCompleted = todayLog.tasksCompleted || {};
            todayLog.tasksCompleted[taskKey] = isSubstantiallyFilled;

            const mainCheckbox = document.getElementById(`${taskKey}TaskDone`);
            if (mainCheckbox) {
                mainCheckbox.checked = isSubstantiallyFilled;
                // If user unchecks main box, perhaps clear sub-tasks or just visual?
                // For now, main checkbox is driven by sub-task completion.
            }
            
            const card = document.getElementById(`${taskKey}-task`);
            if(card) {
                if(isSubstantiallyFilled) card.classList.add('completed-task');
                else card.classList.remove('completed-task');
            }

            this.saveData();
            this.checkDayCompletionStatus();
        },

        updateTaskCheckboxState(taskKey, forceState = undefined) {
            const todayLog = this.getTodayLog();
            if (!todayLog || !todayLog.tasksCompleted) return;

            const isComplete = forceState !== undefined ? forceState : todayLog.tasksCompleted[taskKey] || false;

            const mainCheckbox = document.getElementById(`${taskKey}TaskDone`);
            if (mainCheckbox) mainCheckbox.checked = isComplete;
            
            const card = document.getElementById(`${taskKey}-task`);
            if (card) {
                 if(isComplete) card.classList.add('completed-task');
                 else card.classList.remove('completed-task');
            }
        },

        checkDayCompletionStatus() {
            const todayLog = this.getTodayLog();
            if (!todayLog || !todayLog.tasksCompleted) {
                this.elements.completeDayBtn.disabled = true;
                return;
            }

            const allTasks = ['sleep', 'weightControl', 'exercise', 'peaceOfMind', 'makeMeQuit'];
            const completedTasksCount = allTasks.filter(task => todayLog.tasksCompleted[task]).length;
            
            const allTasksCompleted = completedTasksCount === allTasks.length;
            
            this.elements.completeDayBtn.disabled = !allTasksCompleted || this.state.isDayCompleted;
            this.elements.completeDayBtn.textContent = this.state.isDayCompleted ? "Day Already Completed" : (allTasksCompleted ? "Mark Day as Complete" : `Complete ${allTasks.length - completedTasksCount} more tasks`);

            if (this.state.isDayCompleted) {
                this.elements.dailyCompletionMessage.textContent = "Great job! You've completed all tasks for today.";
                this.elements.dailyCompletionMessage.className = 'feedback-message success';
                this.elements.dailyCompletionMessage.classList.remove('hidden');
            } else {
                this.elements.dailyCompletionMessage.classList.add('hidden');
            }
        },

        handleCompleteDay() {
            if (this.state.isDayCompleted) return;

            this.state.isDayCompleted = true;
            const todayLog = this.getTodayLog();
            todayLog.dayCompleted = true;

            this.addPoints(25, "All Daily Tasks Completed!");
            this.sendNotification("Day Complete!", "Awesome work, you've completed all tasks for today!");
            this.showInAppNotification("Day marked as complete! Fantastic effort!", "success");

            this.saveData();
            this.checkDayCompletionStatus(); // Update button state

            // Check for week completion
            if (this.isWeekComplete()) {
                this.handleWeekCompletion();
            }
        },
        
        isWeekComplete() {
            const W = this.state.currentChallengeWeek;
            const startDate = new Date(this.state.userData.startDate);
            let daysCompletedThisWeek = 0;
            for (let i = 0; i < 7; i++) {
                const dayToCheck = new Date(startDate);
                dayToCheck.setDate(startDate.getDate() + (W - 1) * 7 + i);
                const dayKey = dayToCheck.toISOString().split('T')[0];
                if (this.state.userData.dailyLogs[dayKey] && this.state.userData.dailyLogs[dayKey].dayCompleted) {
                    daysCompletedThisWeek++;
                }
            }
            // Define "week complete" - e.g., 5 out of 7 days
            return daysCompletedThisWeek >= 5;
        },

        handleWeekCompletion() {
            const W = this.state.currentChallengeWeek;
            const badgeName = `Week ${W} Warrior`;
            if (!this.state.userData.badges.includes(badgeName)) {
                this.state.userData.badges.push(badgeName);
                this.addPoints(100, `Completed Week ${W}`);
                this.showInAppNotification(`Congratulations! You've earned the "${badgeName}" badge!`, "success", 10000);
                this.sendNotification("Week Complete!", `You've conquered Week ${W}! Keep it up!`);
            }
            // Potentially advance week or show summary - for now, week advances naturally by date.
            this.saveData();
        },

        addPoints(amount, reason) {
            this.state.userData.points += amount;
            console.log(`+${amount} points for: ${reason}`);
            // Could add a log of points earned:
            // this.state.userData.pointLog = this.state.userData.pointLog || [];
            // this.state.userData.pointLog.push({ date: this.state.today, amount, reason });
            this.updateUserDisplay(); // Update UI immediately
            // No need to call saveData() here, it will be called by the action that triggered points.
        },

        // --- "Motivate Me Now!" ---
        handleGetMotivation() {
            const area = this.elements.motivationAreaSelect.value;
            this.elements.motivationMessage.textContent = "Fetching motivation (simulated)...";

            // Simulate gathering progress data for the LLM
            const userContext = {
                area: area,
                name: this.state.userData.name,
                currentWeek: this.state.currentChallengeWeek,
                points: this.state.userData.points,
                // Add more relevant data based on 'area', e.g., recent sleep scores, weight trend, exercise streak
            };

            // Simulate API call
            fetch(this.MOTIVATION_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userContext)
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                this.elements.motivationMessage.textContent = data.motivationSpeech || "Keep going, you're doing great!";
            })
            .catch(error => {
                console.warn("Motivate Me API call failed (expected for simulation):", error);
                this.elements.motivationMessage.innerHTML = `
                    <p><strong>Simulated Motivation for ${area.replace(/([A-Z])/g, ' $1')}:</strong></p>
                    <p>Hey ${this.state.userData.name || 'there'}! Remember why you started. Even small steps forward in ${area.replace(/([A-Z])/g, ' $1')} build momentum. You've already come to week ${this.state.currentChallengeWeek}. You've got this! Take a deep breath and try one small part of the task. You'll feel better once you start.</p>
                    <p><small>(This is a simulated response. An actual LLM would provide more personalized advice.)</small></p>`;
            });
        },

        // --- "LLM Chat" for Peace of Mind ---
        handleLlmChatSend() {
            const userInput = this.elements.llmChatInput.value.trim();
            if (!userInput) return;

            this.elements.llmChatResponse.innerHTML += `<p><strong>You:</strong> ${userInput}</p>`;
            this.elements.llmChatInput.value = '';
            this.elements.llmChatResponse.scrollTop = this.elements.llmChatResponse.scrollHeight;

            fetch(this.LLM_CHAT_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userInput, userId: this.state.userData.name }) // Example payload
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                this.elements.llmChatResponse.innerHTML += `<p><strong>Bot:</strong> ${data.reply || "I'm here to listen."}</p>`;
            })
            .catch(error => {
                console.warn("LLM Chat API call failed (expected for simulation):", error);
                this.elements.llmChatResponse.innerHTML += `<p><strong>Bot (Simulated):</strong> Thanks for sharing, ${this.state.userData.name || 'friend'}. It sounds like you're dealing with [<em>echo a keyword if possible, or generic acknowledgement</em>]. Remember to be kind to yourself. What's one small thing you could do right now to feel a tiny bit better?</p><p><small>(This is a simulated response.)</small></p>`;
            })
            .finally(() => {
                this.elements.llmChatResponse.scrollTop = this.elements.llmChatResponse.scrollHeight;
                 this.addPoints(1, "Used LLM Chat for stress");
                 this.saveData();
            });
        },

        // --- Modal Handling ---
        showModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('hidden');
        },

        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('hidden');
            // Clear dynamic modal content if necessary
            if (modalId === 'motivateModal') this.elements.motivationMessage.textContent = '';
            if (modalId === 'llmChatModal') { /* this.elements.llmChatResponse.innerHTML = ''; Don't clear chat history */ }
        },

        // --- Educational Content ---
        showEducationModal(title, text) {
            this.elements.educationTitle.textContent = title;
            this.elements.educationText.textContent = text;
            this.showModal('educationModal');
        },

        // --- Handling Missed Days ---
        checkForMissedDays() {
            if (!this.state.userData || !this.state.userData.lastLoginDate) return;

            const lastLogin = new Date(this.state.userData.lastLoginDate);
            const today = new Date(this.state.today);
            const diffTime = today - lastLogin;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                this.showInAppNotification(`Welcome back, ${this.state.userData.name}! It's been ${diffDays} days. Glad to see you again. Let's pick up where you left off!`, "info", 10000);
            } else if (diffDays === 1 && this.state.userData.lastLoginDate !== this.state.today) {
                 this.showInAppNotification(`Welcome back, ${this.state.userData.name}! Ready for another great day?`, "info", 7000);
            }
            this.state.userData.lastLoginDate = this.state.today;
            this.saveData(); // Save updated last login date
        },

    }; // End App Object

    App.init(); // Start the application
});