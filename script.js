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
            // Modals (references to the modal container itself)
            motivateModal: document.getElementById('motivateModal'),
            motivationAreaSelect: document.getElementById('motivationAreaSelect'),
            getMotivationBtn: document.getElementById('getMotivationBtn'),
            motivationMessage: document.getElementById('motivationMessage'),
            llmChatModal: document.getElementById('llmChatModal'),
            llmChatInput: document.getElementById('llmChatInput'),
            sendToLlmBtn: document.getElementById('sendToLlmBtn'),
            llmChatResponse: document.getElementById('llmChatResponse'),
            educationModal: document.getElementById('educationModal'),
            educationTitle: document.getElementById('educationTitle'), // This is modal-card-title
            educationText: document.getElementById('educationText'), // This is in modal-card-body
            // Notifications
            inAppNotification: document.getElementById('inAppNotification'),
            inAppNotificationText: document.getElementById('inAppNotificationText'), // This is a span now
            dismissNotificationBtn: document.getElementById('dismissNotificationBtn'),
            // Footer
            currentYear: document.getElementById('currentYear'),
        },

        // --- App State & Data ---
        state: {
            currentScreen: 'welcome',
            userData: null,
            currentChallengeWeek: 1,
            totalChallengeWeeks: 10,
            today: new Date().toISOString().split('T')[0],
            isDayCompleted: false,
        },

        // --- Constants ---
        DB_KEY: 'bodyAndSoulAppUserBulma', // Changed key slightly to avoid conflicts with old data
        LLM_CHAT_API_ENDPOINT: 'https://api.example.com/llm-chat',
        MOTIVATION_API_ENDPOINT: 'https://api.example.com/motivate',

        init() {
            console.log("App Initializing with Bulma...");
            this.registerServiceWorker();
            this.loadData();
            this.setupEventListeners();
            this.updateFooterYear();

            if (this.state.userData && this.state.userData.isRegistered && this.state.userData.hasCompletedBaseline) {
                this.elements.continueChallengeBtn.classList.remove('is-hidden');
                this.elements.startChallengeBtn.textContent = 'Start Over';
                this.navigateTo('dashboard');
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

        registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('Service Worker registered with scope:', registration.scope))
                    .catch(error => console.error('Service Worker registration failed:', error));
            }
        },
        requestNotificationPermission() { /* ... (no change) ... */ },
        sendNotification(title, body) { /* ... (no change) ... */ },

        showInAppNotification(message, type = 'is-info', duration = 5000) { // Bulma types: is-success, is-warning, is-danger, is-info, is-primary, is-link
            this.elements.inAppNotificationText.textContent = message;
            // Remove all Bulma color classes then add the new one
            this.elements.inAppNotification.className = 'notification is-fixed-bottom-custom'; // Reset classes
            this.elements.inAppNotification.classList.add(type);
            this.elements.inAppNotification.classList.remove('is-hidden');

            setTimeout(() => {
                this.elements.inAppNotification.classList.add('is-hidden');
            }, duration);
        },

        loadData() { /* ... (no change, just DB_KEY is different) ... */
            const data = localStorage.getItem(this.DB_KEY);
            if (data) {
                this.state.userData = JSON.parse(data);
                this.state.userData.dailyLogs = this.state.userData.dailyLogs || {};
                this.state.userData.points = this.state.userData.points || 0;
                this.state.userData.badges = this.state.userData.badges || [];
                this.state.userData.makeMeQuit = this.state.userData.makeMeQuit || {
                    behavior: null, trigger: null, substitution: null, log: {}
                };
                this.state.userData.peaceOfMind = this.state.userData.peaceOfMind || {
                    moodStressLog: {}, gratitudeLog: {}
                };
                this.state.currentChallengeWeek = this.state.userData.currentChallengeWeek || 1;
                const todayLog = this.state.userData.dailyLogs[this.state.today];
                this.state.isDayCompleted = todayLog ? todayLog.dayCompleted || false : false;
            } else {
                this.state.userData = this.getDefaultUserData();
            }
        },
        saveData() { /* ... (no change) ... */
            try {
                localStorage.setItem(this.DB_KEY, JSON.stringify(this.state.userData));
                this.updateUserDisplay();
            } catch (e) {
                console.error("Error saving data to localStorage:", e);
                this.showInAppNotification("Could not save progress. Your browser storage might be full.", "is-danger");
            }
        },
        getDefaultUserData() { /* ... (no change) ... */
            return {
                name: '', age: null, gender: '', initialWeight: null, currentWeight: null,
                height: null, idealWeight: null, caloricDeficitTarget: null,
                baselineCardio: '', baselineStrength: '', exerciseTrack: 'beginner',
                isRegistered: false, hasCompletedBaseline: false, startDate: null,
                currentChallengeWeek: 1, lastLoginDate: this.state.today, dailyLogs: {},
                points: 0, badges: [],
                makeMeQuit: { behavior: null, trigger: null, substitution: null, log: {} },
                peaceOfMind: { moodStressLog: {}, gratitudeLog: {} }
            };
        },
        updateUserDisplay() { /* ... (no change) ... */
            if (this.state.userData && this.state.userData.name) {
                this.elements.userNameDisplay.textContent = `Hi, ${this.state.userData.name}!`;
            } else {
                this.elements.userNameDisplay.textContent = '';
            }
            this.elements.userPointsDisplay.textContent = `${this.state.userData.points || 0}`;
        },

        navigateTo(screenName) {
            ['welcomeScreen', 'registrationScreen', 'baselineScreen', 'dashboardScreen'].forEach(id => {
                this.elements[id].classList.add('is-hidden'); // Use Bulma's hide class
            });
            if (this.elements[screenName + 'Screen']) {
                this.elements[screenName + 'Screen'].classList.remove('is-hidden');
                this.state.currentScreen = screenName;
            } else {
                console.error("Screen not found:", screenName);
                this.elements.welcomeScreen.classList.remove('is-hidden');
                this.state.currentScreen = 'welcome';
            }

            if (screenName === 'dashboard') {
                this.renderDashboard();
            }
        },

        setupEventListeners() {
            this.elements.startChallengeBtn.addEventListener('click', () => {
                if (this.state.userData && this.state.userData.isRegistered && this.state.userData.hasCompletedBaseline) {
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
            this.elements.registrationForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleRegistration(); });
            this.elements.baselineForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleBaseline(); });
            this.elements.motivateMeBtn.addEventListener('click', () => this.showModal('motivateModal'));
            this.elements.getMotivationBtn.addEventListener('click', () => this.handleGetMotivation());
            this.elements.sendToLlmBtn.addEventListener('click', () => this.handleLlmChatSend());

            // Modal close buttons (Bulma's .delete or any button with data-target-modal)
            document.querySelectorAll('.delete, .closeModalBtn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetModalId = e.currentTarget.dataset.targetModal || e.currentTarget.closest('.modal')?.id;
                    if (targetModalId) this.closeModal(targetModalId);
                });
            });
             // Close modal on modal-background click
            document.querySelectorAll('.modal-background').forEach(bg => {
                bg.addEventListener('click', (e) => {
                    const targetModalId = e.currentTarget.closest('.modal')?.id;
                    if (targetModalId) this.closeModal(targetModalId);
                });
            });

            this.elements.completeDayBtn.addEventListener('click', () => this.handleCompleteDay());
            this.elements.dismissNotificationBtn.addEventListener('click', () => this.elements.inAppNotification.classList.add('is-hidden'));
        },

        handleRegistration() { /* ... (no change, just error message type) ... */
            const name = document.getElementById('name').value.trim();
            const age = parseInt(document.getElementById('age').value);
            const gender = document.getElementById('gender').value;
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseInt(document.getElementById('height').value);

            if (!name || isNaN(age) || !gender || isNaN(weight) || isNaN(height)) {
                this.showInAppNotification("Please fill all fields correctly.", "is-danger");
                return;
            }
            // ... rest of registration logic same
            this.state.userData.name = name;
            this.state.userData.age = age;
            this.state.userData.gender = gender;
            this.state.userData.initialWeight = weight;
            this.state.userData.currentWeight = weight;
            this.state.userData.height = height;
            this.state.userData.isRegistered = true;
            this.state.userData.startDate = this.state.today;
            this.state.userData.lastLoginDate = this.state.today;
            const heightInMeters = height / 100;
            this.state.userData.idealWeight = (22.5 * Math.pow(heightInMeters, 2)).toFixed(1);
            this.state.userData.caloricDeficitTarget = 500;
            this.saveData();
            this.navigateTo('baseline');
        },
        handleBaseline() { /* ... (no change, just error message type) ... */
            const cardio = document.getElementById('cardioCapacity').value.trim();
            const strength = document.getElementById('strengthReps').value.trim();
            const track = document.getElementById('exerciseTrack').value;

            if (!cardio || !strength || !track) {
                this.showInAppNotification("Please fill all baseline fields.", "is-danger");
                return;
            }
            // ... rest of baseline logic same
            this.state.userData.baselineCardio = cardio;
            this.state.userData.baselineStrength = strength;
            this.state.userData.exerciseTrack = track;
            this.state.userData.hasCompletedBaseline = true;
            this.state.userData.currentChallengeWeek = 1;
            this.saveData();
            this.addPoints(20, "Baseline Complete");
            this.navigateTo('dashboard');
        },

        renderDashboard() { /* ... (no change) ... */
            if (!this.state.userData || !this.state.userData.isRegistered || !this.state.userData.hasCompletedBaseline) {
                this.navigateTo('welcome'); return;
            }
            this.updateCurrentWeek();
            this.elements.currentWeekDisplay.textContent = this.state.currentChallengeWeek;
            this.elements.challengeProgress.value = (this.state.currentChallengeWeek / this.state.totalChallengeWeeks) * 100;
            this.elements.dailyTasksContainer.innerHTML = '';

            this.renderSleepTask();
            this.renderWeightControlTask();
            this.renderExerciseTask();
            this.renderPeaceOfMindTask();
            this.renderMakeMeQuitTask();

            this.checkDayCompletionStatus();
        },
        updateCurrentWeek() { /* ... (no change) ... */
            if (!this.state.userData.startDate) return;
            const startDate = new Date(this.state.userData.startDate);
            const todayDate = new Date(this.state.today);
            const diffTime = Math.abs(todayDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let currentWeek = Math.floor(diffDays / 7) + 1;
            currentWeek = Math.min(currentWeek, this.state.totalChallengeWeeks);
            this.state.currentChallengeWeek = currentWeek;
            this.state.userData.currentChallengeWeek = currentWeek;
        },
        getTodayLog(createIfNotExist = false) { /* ... (no change) ... */
             if (!this.state.userData.dailyLogs[this.state.today] && createIfNotExist) {
                this.state.userData.dailyLogs[this.state.today] = {
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
                    tasksCompleted: {},
                    dayCompleted: false
                };
            }
            return this.state.userData.dailyLogs[this.state.today];
        },

        // --- Individual Task Rendering Functions (Bulma classes added to HTML strings) ---
        renderSleepTask() {
            const W = this.state.currentChallengeWeek;
            const todayLog = this.getTodayLog(true).sleep;
            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="sleepTaskDone" data-task="sleep">Sleep</label></p></div>
                           <div class="card-content content">`; // Bulma card structure

            if (W === 1) {
                content += `<div class="field">
                                <label class="label is-small" for="bedtime">Bedtime:</label>
                                <div class="control"><input class="input is-small" type="time" id="bedtime" value="${todayLog.bedtime || ''}"></div>
                            </div>
                            <div class="field">
                                <label class="label is-small" for="waketime">Wake-up Time:</label>
                                <div class="control"><input class="input is-small" type="time" id="waketime" value="${todayLog.waketime || ''}"></div>
                            </div>`;
            } else {
                const targetBedtime = this.state.userData.sleepTargetBedtime || "22:30";
                const targetWaketime = this.state.userData.sleepTargetWaketime || "06:30";
                content += `<p class="is-size-7">Target: Bed by ${targetBedtime}, Awake by ${targetWaketime}</p>
                            <div class="field">
                                <label class="label is-small" for="bedtime">Actual Bedtime:</label>
                                <div class="control"><input class="input is-small" type="time" id="bedtime" value="${todayLog.bedtime || ''}"></div>
                            </div>
                            <div class="field">
                                <label class="label is-small" for="waketime">Actual Wake-up Time:</label>
                                <div class="control"><input class="input is-small" type="time" id="waketime" value="${todayLog.waketime || ''}"></div>
                            </div>
                            <div id="sleepTargetStatus" class="task-display">Status: ${todayLog.targetMet === null ? 'Enter times' : (todayLog.targetMet ? 'Goal Met!' : 'Goal Missed')}</div>`;
            }
            content += `<div id="sleepDurationDisplay" class="task-display">Total Sleep: ${todayLog.duration || 'N/A'}</div></div>`; // Close card-content

            this.addCardToDashboard('sleep-task', content, 'is-one-third'); // Example column size

            document.getElementById('bedtime').addEventListener('change', (e) => this.updateSleepData('bedtime', e.target.value));
            document.getElementById('waketime').addEventListener('change', (e) => this.updateSleepData('waketime', e.target.value));
            this.updateTaskCheckboxState('sleep');
        },
        updateSleepData(field, value) { /* ... (no change to core logic) ... */
            const todayLog = this.getTodayLog().sleep;
            todayLog[field] = value;

            if (todayLog.bedtime && todayLog.waketime) {
                const bedtimeDate = new Date(`2000-01-01T${todayLog.bedtime}`);
                let waketimeDate = new Date(`2000-01-01T${todayLog.waketime}`);
                if (waketimeDate < bedtimeDate) waketimeDate.setDate(waketimeDate.getDate() + 1);
                const diffMs = waketimeDate - bedtimeDate;
                const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(1);
                todayLog.duration = `${diffHours} hours`;
                document.getElementById('sleepDurationDisplay').textContent = `Total Sleep: ${todayLog.duration}`;

                if (this.state.currentChallengeWeek > 1) {
                    const targetBed = this.state.userData.sleepTargetBedtime || "22:30";
                    const targetWake = this.state.userData.sleepTargetWaketime || "06:30";
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
            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="weightControlTaskDone" data-task="weightControl">Weight Control</label></p></div>
                           <div class="card-content content">`;

            if (W === 1) {
                content += `<p class="is-size-7">Ideal: ${userData.idealWeight} kg. Deficit: ${userData.caloricDeficitTarget} kcal.</p>
                            <div class="field"><label class="label is-small" for="wcMealTimes">Mealtimes:</label><div class="control"><input class="input is-small" type="text" id="wcMealTimes" placeholder="8am, 1pm, 6pm" value="${todayLog.mealtimes || ''}"></div></div>
                            <div class="field"><label class="label is-small" for="wcWater">Water (L):</label><div class="control"><input class="input is-small" type="number" step="0.1" id="wcWater" placeholder="2.5" value="${todayLog.water || ''}"></div></div>
                            <div class="field"><label class="label is-small" for="wcFood">Food Log:</label><div class="control"><textarea class="textarea is-small" id="wcFood" rows="2" placeholder="Oats, Chicken salad...">${todayLog.food || ''}</textarea></div></div>
                            <div class="field"><label class="label is-small" for="wcNonWaterDrinks">Non-water drinks:</label><div class="control"><input class="input is-small" type="text" id="wcNonWaterDrinks" placeholder="1 coffee, 1 soda" value="${todayLog.nonWaterDrinks || ''}"></div></div>`;
            } else if (W === 2) {
                content += `<p class="is-size-7">Continue tracking. Reduce junk, use fruit snacks, set meal times.</p>
                            ${this.renderWeightControlTaskInputs(todayLog)}
                            <div class="task-item"><label class="checkbox"><input type="checkbox" id="wcJunkFood" ${todayLog.junkFoodStopped ? 'checked' : ''}> Stop non-water/junk food.</label></div>
                            <div class="task-item"><label class="checkbox"><input type="checkbox" id="wcFruitSnacks" ${todayLog.fruitSnacks ? 'checked' : ''}> Replace snacks with fruits.</label></div>
                            <div class="task-item"><label class="checkbox"><input type="checkbox" id="wcMealTimesAdhered" ${todayLog.mealTimesAdhered ? 'checked' : ''}> Adhere to set meal times.</label></div>`;
            } else { // Weeks 3-10
                content += `<p class="is-size-7">Continue tracking. Maintain ${userData.caloricDeficitTarget} kcal deficit.</p>
                            ${this.renderWeightControlTaskInputs(todayLog)}
                            <div class="field"><label class="label is-small" for="wcCalories">Est. Calories:</label><div class="control"><input class="input is-small" type="number" id="wcCalories" placeholder="1800" value="${todayLog.caloriesTracked || ''}"></div></div>
                            <p class="task-display">Daily calorie goal (approx): ${this.calculateDailyCalorieGoal()} kcal</p>`;
            }
            content += `</div>`; // Close card-content
            this.addCardToDashboard('weight-control-task', content, 'is-one-third');
            // ... (Event listeners setup as before, no change in that logic)
            document.getElementById('wcMealTimes')?.addEventListener('input', (e) => this.updateWeightLog('mealtimes', e.target.value));
            document.getElementById('wcWater')?.addEventListener('input', (e) => this.updateWeightLog('water', e.target.value));
            document.getElementById('wcFood')?.addEventListener('input', (e) => this.updateWeightLog('food', e.target.value));
            document.getElementById('wcNonWaterDrinks')?.addEventListener('input', (e) => this.updateWeightLog('nonWaterDrinks', e.target.value));
            document.getElementById('wcJunkFood')?.addEventListener('change', (e) => this.updateWeightLog('junkFoodStopped', e.target.checked, 2));
            document.getElementById('wcFruitSnacks')?.addEventListener('change', (e) => this.updateWeightLog('fruitSnacks', e.target.checked, 2));
            document.getElementById('wcMealTimesAdhered')?.addEventListener('change', (e) => this.updateWeightLog('mealTimesAdhered', e.target.checked, 2));
            document.getElementById('wcCalories')?.addEventListener('input', (e) => this.updateWeightLog('caloriesTracked', e.target.value, 5));
            this.updateTaskCheckboxState('weightControl');
        },
        renderWeightControlTaskInputs(todayLog) {
            return `<div class="field"><label class="label is-small" for="wcMealTimes">Mealtimes:</label><div class="control"><input class="input is-small" type="text" id="wcMealTimes" value="${todayLog.mealtimes || ''}"></div></div>
                    <div class="field"><label class="label is-small" for="wcWater">Water (L):</label><div class="control"><input class="input is-small" type="number" step="0.1" id="wcWater" value="${todayLog.water || ''}"></div></div>
                    <div class="field"><label class="label is-small" for="wcFood">Food Log:</label><div class="control"><textarea class="textarea is-small" id="wcFood" rows="2">${todayLog.food || ''}</textarea></div></div>
                    <div class="field"><label class="label is-small" for="wcNonWaterDrinks">Non-water drinks:</label><div class="control"><input class="input is-small" type="text" id="wcNonWaterDrinks" value="${todayLog.nonWaterDrinks || ''}"></div></div>`;
        },
        calculateDailyCalorieGoal() { /* ... (no change) ... */
            const baseMaintenance = this.state.userData.gender === 'female' ? 1800 : 2200;
            return baseMaintenance - (this.state.userData.caloricDeficitTarget || 500);
        },
        updateWeightLog(field, value, points = 1) { /* ... (no change) ... */
            const todayLog = this.getTodayLog().weightControl;
            todayLog[field] = value;
            if (value === true || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && !isNaN(value))) {
                this.addPoints(points, `Weight Control: ${field}`);
            }
            this.saveData();
            this.checkTaskCompletion('weightControl', this.isWeightControlTaskSubstantiallyFilled());
        },
        isWeightControlTaskSubstantiallyFilled() { /* ... (no change) ... */
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

            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="exerciseTaskDone" data-task="exercise" ${todayLog.exerciseCompleted ? 'checked' : ''}>Exercise</label></p></div>
                           <div class="card-content content">
                           <p class="is-size-7">Track: <span class="tag is-info is-light">${track.charAt(0).toUpperCase() + track.slice(1)}</span></p>
                           <p class="is-size-6 has-text-weight-semibold">Cardio:</p>
                           <p class="is-size-7">${routine.cardio}</p>
                           <p class="is-size-6 has-text-weight-semibold">Strength:</p>
                           <p class="is-size-7">${routine.strength}</p>
                           <div class="task-item mt-3"><label class="checkbox"><input type="checkbox" id="exerciseCompletedCheck" ${todayLog.exerciseCompleted ? 'checked' : ''}> Mark as completed</label></div>
                           </div>`;

            this.addCardToDashboard('exercise-task', content, 'is-one-third');
            document.getElementById('exerciseCompletedCheck').addEventListener('change', (e) => {
                todayLog.exerciseCompleted = e.target.checked;
                if(e.target.checked) this.addPoints(10, "Exercise Completed");
                this.saveData();
                this.checkTaskCompletion('exercise', e.target.checked);
            });
            this.updateTaskCheckboxState('exercise', todayLog.exerciseCompleted);
        },
        getExerciseRoutine(week, track, gender, age) { /* ... (no change) ... */
            let baseCardioMins = 15;
            let baseStrengthSets = "2 sets of 10-12 reps (e.g., bodyweight squats, push-ups variation, planks)";
            let trackMultiplier = 1.0;
            if (track === 'intermediate') trackMultiplier = 1.2;
            if (track === 'advanced') trackMultiplier = 1.5;
            let cardioMins = Math.round(baseCardioMins * trackMultiplier + (week - 1) * 2 * trackMultiplier);
            cardioMins = Math.min(cardioMins, 60);
            let strengthDesc = baseStrengthSets;
            if (week > 3) strengthDesc = strengthDesc.replace("2 sets", "3 sets");
            if (week > 6) strengthDesc = strengthDesc.replace("10-12 reps", "12-15 reps or harder variations");
            return { cardio: `${cardioMins} mins moderate intensity (brisk walk, jog, cycle).`, strength: strengthDesc };
        },

        renderPeaceOfMindTask() {
            const W = this.state.currentChallengeWeek;
            const todayLogPOM = this.getTodayLog(true).peaceOfMind;
            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="peaceOfMindTaskDone" data-task="peaceOfMind">Peace of Mind</label></p></div>
                           <div class="card-content content">`;
            
            content += `<div class="task-item">
                            <label class="checkbox"><input type="checkbox" id="pomMindfulness" ${todayLogPOM.mindfulnessCompleted ? 'checked' : ''}> 1-min Mindfulness.</label>
                            <button class="button is-small is-outlined is-primary ml-2" id="startMindfulnessTimerBtn">Timer</button>
                            <span id="mindfulnessTimerDisplay" class="is-size-7 ml-1"></span>
                        </div>`;
            content += `<div class="mt-2"><label class="label is-small mb-0">Mood (1-10):</label> Before: <input type="number" min="1" max="10" id="pomMoodBefore" class="input is-small small-input" value="${todayLogPOM.moodBefore || ''}"> After: <input type="number" min="1" max="10" id="pomMoodAfter" class="input is-small small-input" value="${todayLogPOM.moodAfter || ''}"></div>`;
            content += `<div class="mt-1"><label class="label is-small mb-0">Stress (1-10):</label> Before: <input type="number" min="1" max="10" id="pomStressBefore" class="input is-small small-input" value="${todayLogPOM.stressBefore || ''}"> After: <input type="number" min="1" max="10" id="pomStressAfter" class="input is-small small-input" value="${todayLogPOM.stressAfter || ''}"></div>`;
            content += `<div class="task-item mt-2"><label class="checkbox"><input type="checkbox" id="pomBreathing" ${todayLogPOM.breathingCompleted ? 'checked' : ''}> Breathing exercises.</label> <button class="button is-small is-outlined is-info ml-2" data-education="breathing">Info</button></div>`;
            content += `<div class="task-item mt-2">
                            Talk about stress triggers.
                            <button class="button is-small is-outlined is-link ml-2" id="openLlmChatBtn">Chat</button>
                        </div>`;
            content += `<div class="task-item mt-2"><label class="checkbox"><input type="checkbox" id="pomEnjoyableActivity" ${todayLogPOM.enjoyableActivityCompleted ? 'checked' : ''}> 30 mins enjoyable activity.</label></div>`;

            if (W >= 2) {
                const gratitudeLog = this.state.userData.peaceOfMind.gratitudeLog;
                const gratitudeKey = `week${W}`;
                content += `<hr><p class="has-text-weight-semibold is-size-7">Weekly Gratitude:</p>
                            <textarea id="pomGratitude" class="textarea is-small" rows="2" placeholder="One thing grateful for...">${gratitudeLog[gratitudeKey] || ''}</textarea>`;
            }
            content += `</div>`; // Close card-content
            this.addCardToDashboard('peace-of-mind-task', content, 'is-one-third');
            // ... (Event listeners setup as before, no change in that logic)
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
                    "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat for 2-5 minutes. This calms the nervous system."
                );
            });
            this.updateTaskCheckboxState('peaceOfMind');
        },
        startMindfulnessTimer() { /* ... (no change) ... */
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
        updatePeaceOfMindLog(field, value, points = 1) { /* ... (no change) ... */
            const todayLogPOM = this.getTodayLog().peaceOfMind;
            todayLogPOM[field] = value;
            if(value === true || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && !isNaN(value))) {
                if (field.endsWith('Completed') && value === true) this.addPoints(points, `Peace of Mind: ${field}`);
                else if (!field.endsWith('Completed')) this.addPoints(0.5, `Peace of Mind: ${field} logged`);
            }
            this.saveData();
            this.checkTaskCompletion('peaceOfMind', this.isPeaceOfMindTaskSubstantiallyFilled());
        },
        updateGratitudeLog(value) { /* ... (no change) ... */
            const gratitudeLog = this.state.userData.peaceOfMind.gratitudeLog;
            const gratitudeKey = `week${this.state.currentChallengeWeek}`;
            if (!gratitudeLog[gratitudeKey] && value.trim().length > 0) {
                this.addPoints(5, "Weekly Gratitude Logged");
            }
            gratitudeLog[gratitudeKey] = value;
            this.saveData();
        },
        isPeaceOfMindTaskSubstantiallyFilled() { /* ... (no change) ... */
            const log = this.getTodayLog().peaceOfMind;
            return log.mindfulnessCompleted && log.breathingCompleted && log.enjoyableActivityCompleted && log.moodBefore && log.stressBefore && log.moodAfter && log.stressAfter;
        },

        renderMakeMeQuitTask() {
            const W = this.state.currentChallengeWeek;
            const mmqData = this.state.userData.makeMeQuit;
            const todayLogMMQ = this.getTodayLog(true).makeMeQuit;
            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="makeMeQuitTaskDone" data-task="makeMeQuit">Make Me Quit</label></p></div>
                           <div class="card-content content">`;

            if (!mmqData.behavior && W >= 1) {
                content += `<p class="is-size-7">Identify one unhealthy behavior to change.</p>
                            <div class="field"><label class="label is-small" for="mmqBehaviorInput">Behavior to Quit:</label><div class="control"><input class="input is-small" type="text" id="mmqBehaviorInput" placeholder="e.g., mindless snacking after 8pm"></div></div>`;
            } else {
                content += `<p class="is-size-7">Focus: Modifying "<strong>${mmqData.behavior || 'Not Set'}</strong>"</p>`;
            }

            if (mmqData.behavior) {
                if (W === 1) {
                    content += `<p class="is-size-7"><strong>W1 (Awareness):</strong> Track instances and context.</p>
                                ${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`;
                } else if (W === 2) {
                    if (!mmqData.trigger) {
                        content += `<p class="is-size-7"><strong>W2 (Identify Trigger):</strong> Based on last week, identify a trigger.</p>
                                    <div class="field"><label class="label is-small" for="mmqTriggerInput">Identify Trigger:</label><div class="control"><input class="input is-small" type="text" id="mmqTriggerInput" placeholder="e.g., opening fridge when bored"></div></div>`;
                    } else {
                        content += `<p class="is-size-7">Trigger: "<strong>${mmqData.trigger}</strong>". Continue logging.</p>
                                    ${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`;
                    }
                } else if (W === 3) {
                    if (!mmqData.trigger) content += `<p class="is-size-7">Please identify trigger first (W2 task).</p>`;
                    else content += `<p class="is-size-7"><strong>W3 (Limit Exposure):</strong> Limit exposure to "<strong>${mmqData.trigger}</strong>".</p>
                                    <div class="task-item"><label class="checkbox"><input type="checkbox" id="mmqTriggerAvoided" ${todayLogMMQ.triggerAvoided ? 'checked' : ''}> I worked on limiting trigger exposure.</label></div>
                                    ${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`;
                } else { // Weeks 4-10
                    if (!mmqData.trigger) content += `<p class="is-size-7">Identify trigger first (W2 task).</p>`;
                    else if (!mmqData.substitution) {
                         content += `<p class="is-size-7"><strong>W4+ (Substitution):</strong> Plan substitution for "${mmqData.trigger}".</p>
                                    <div class="field"><label class="label is-small" for="mmqSubstitutionInput">Substitution Behavior:</label><div class="control"><input class="input is-small" type="text" id="mmqSubstitutionInput" placeholder="e.g., drink water, 5 squats"></div></div>
                                    ${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`;
                    } else {
                        content += `<p class="is-size-7"><strong>W4-10 (Practice):</strong> Practice "<strong>${mmqData.substitution}</strong>" for "<strong>${mmqData.trigger}</strong>".</p>
                                    <div class="task-item"><label class="checkbox"><input type="checkbox" id="mmqSubstitutionPracticed" ${todayLogMMQ.substitutionPracticed ? 'checked' : ''}> I practiced my substitution.</label></div>
                                    ${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`;
                    }
                }
            }
            content += `</div>`; // Close card-content
            this.addCardToDashboard('make-me-quit-task', content, 'is-one-third');
            // ... (Event listeners setup as before, no change in that logic)
            document.getElementById('mmqBehaviorInput')?.addEventListener('change', (e) => this.updateMMQData('behavior', e.target.value));
            document.getElementById('mmqInstances')?.addEventListener('input', (e) => this.updateMMQLog('instancesLogged', parseInt(e.target.value) || 0));
            document.getElementById('mmqContext')?.addEventListener('input', (e) => this.updateMMQLog('contextLogged', e.target.value));
            document.getElementById('mmqTriggerInput')?.addEventListener('change', (e) => this.updateMMQData('trigger', e.target.value, 5));
            document.getElementById('mmqTriggerAvoided')?.addEventListener('change', (e) => this.updateMMQLog('triggerAvoided', e.target.checked, 3));
            document.getElementById('mmqSubstitutionInput')?.addEventListener('change', (e) => this.updateMMQData('substitution', e.target.value, 5));
            document.getElementById('mmqSubstitutionPracticed')?.addEventListener('change', (e) => this.updateMMQLog('substitutionPracticed', e.target.checked, 3));
            this.updateTaskCheckboxState('makeMeQuit');
        },
        renderMMQWeek1InputsBulma(todayLogMMQ) { // Renamed to avoid conflict
            return `<div class="field mt-2"><label class="label is-small" for="mmqInstances">Times today:</label><div class="control"><input class="input is-small" type="number" id="mmqInstances" min="0" value="${todayLogMMQ.instancesLogged || ''}"></div></div>
                    <div class="field"><label class="label is-small" for="mmqContext">Context/Notes:</label><div class="control"><textarea class="textarea is-small" id="mmqContext" rows="2">${todayLogMMQ.contextLogged || ''}</textarea></div></div>`;
        },
        updateMMQData(field, value, points = 0) { /* ... (no change) ... */
            this.state.userData.makeMeQuit[field] = value;
            if (value.trim().length > 0 && points > 0) this.addPoints(points, `MakeMeQuit: ${field} set`);
            this.saveData();
            this.renderDashboard();
        },
        updateMMQLog(field, value, points = 1) { /* ... (no change) ... */
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
        isMakeMeQuitTaskSubstantiallyFilled() { /* ... (no change) ... */
            const W = this.state.currentChallengeWeek;
            const log = this.getTodayLog().makeMeQuit;
            const data = this.state.userData.makeMeQuit;
            if (!data.behavior) return false;
            if (W === 1) return typeof log.instancesLogged === 'number' && log.contextLogged !== undefined;
            if (W === 2) return data.trigger && typeof log.instancesLogged === 'number';
            if (W === 3) return data.trigger && log.triggerAvoided;
            if (W >= 4) return data.trigger && data.substitution && log.substitutionPracticed;
            return false;
        },

        addCardToDashboard(id, innerHTML, columnClass = 'is-one-third-tablet is-half-mobile') {
            const columnDiv = document.createElement('div');
            columnDiv.className = `column ${columnClass}`; // Wrap card in a Bulma column

            const card = document.createElement('div');
            card.id = id;
            card.className = 'card task-card mb-3'; // Bulma card class
            card.innerHTML = innerHTML;
            
            columnDiv.appendChild(card);
            this.elements.dailyTasksContainer.appendChild(columnDiv);
        },

        checkTaskCompletion(taskKey, isSubstantiallyFilled) { /* ... (no change in logic, but visual update might differ) ... */
            const todayLog = this.getTodayLog();
            todayLog.tasksCompleted = todayLog.tasksCompleted || {};
            todayLog.tasksCompleted[taskKey] = isSubstantiallyFilled;

            const mainCheckbox = document.getElementById(`${taskKey}TaskDone`);
            if (mainCheckbox) mainCheckbox.checked = isSubstantiallyFilled;
            
            const card = document.getElementById(`${taskKey}-task`); // This is the card element
            if(card) {
                if(isSubstantiallyFilled) card.classList.add('completed-task'); // Custom class for visual cue
                else card.classList.remove('completed-task');
            }
            this.saveData();
            this.checkDayCompletionStatus();
        },
        updateTaskCheckboxState(taskKey, forceState = undefined) { /* ... (no change in logic) ... */
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

        checkDayCompletionStatus() { /* ... (no change in logic, but dailyCompletionMessage classes change) ... */
            const todayLog = this.getTodayLog();
            if (!todayLog || !todayLog.tasksCompleted) {
                this.elements.completeDayBtn.disabled = true; return;
            }
            const allTasks = ['sleep', 'weightControl', 'exercise', 'peaceOfMind', 'makeMeQuit'];
            const completedTasksCount = allTasks.filter(task => todayLog.tasksCompleted[task]).length;
            const allTasksCompleted = completedTasksCount === allTasks.length;
            
            this.elements.completeDayBtn.disabled = !allTasksCompleted || this.state.isDayCompleted;
            this.elements.completeDayBtn.textContent = this.state.isDayCompleted ? "Day Already Completed" : (allTasksCompleted ? "Mark Day as Complete" : `Complete ${allTasks.length - completedTasksCount} more tasks`);

            if (this.state.isDayCompleted) {
                this.elements.dailyCompletionMessage.textContent = "Great job! You've completed all tasks for today.";
                this.elements.dailyCompletionMessage.className = 'notification is-success mt-3'; // Bulma classes
                this.elements.dailyCompletionMessage.classList.remove('is-hidden');
            } else {
                this.elements.dailyCompletionMessage.classList.add('is-hidden');
            }
        },
        handleCompleteDay() { /* ... (no change in logic, just notification type) ... */
            if (this.state.isDayCompleted) return;
            this.state.isDayCompleted = true;
            const todayLog = this.getTodayLog();
            todayLog.dayCompleted = true;
            this.addPoints(25, "All Daily Tasks Completed!");
            this.sendNotification("Day Complete!", "Awesome work, you've completed all tasks for today!");
            this.showInAppNotification("Day marked as complete! Fantastic effort!", "is-success");
            this.saveData();
            this.checkDayCompletionStatus();
            if (this.isWeekComplete()) this.handleWeekCompletion();
        },
        isWeekComplete() { /* ... (no change) ... */
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
            return daysCompletedThisWeek >= 5;
        },
        handleWeekCompletion() { /* ... (no change in logic, just notification type) ... */
            const W = this.state.currentChallengeWeek;
            const badgeName = `Week ${W} Warrior`;
            if (!this.state.userData.badges.includes(badgeName)) {
                this.state.userData.badges.push(badgeName);
                this.addPoints(100, `Completed Week ${W}`);
                this.showInAppNotification(`Congrats! You've earned the "${badgeName}" badge!`, "is-success", 10000);
                this.sendNotification("Week Complete!", `You've conquered Week ${W}! Keep it up!`);
            }
            this.saveData();
        },
        addPoints(amount, reason) { /* ... (no change) ... */
            this.state.userData.points += amount;
            console.log(`+${amount} points for: ${reason}`);
            this.updateUserDisplay();
        },

        handleGetMotivation() { /* ... (no change to core API call logic) ... */
            const area = this.elements.motivationAreaSelect.value;
            this.elements.motivationMessage.innerHTML = "<p>Fetching motivation (simulated)...</p>"; // Use innerHTML if displaying complex message
            const userContext = { area: area, name: this.state.userData.name, currentWeek: this.state.currentChallengeWeek, points: this.state.userData.points, };
            fetch(this.MOTIVATION_API_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userContext) })
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(data => { this.elements.motivationMessage.innerHTML = `<p>${data.motivationSpeech || "Keep going, you're doing great!"}</p>`; })
            .catch(error => {
                console.warn("Motivate Me API call failed (expected for simulation):", error);
                this.elements.motivationMessage.innerHTML = `
                    <p class="has-text-weight-bold">Simulated Motivation for ${area.replace(/([A-Z])/g, ' $1')}:</p>
                    <p>Hey ${this.state.userData.name || 'there'}! Remember why you started. Small steps in ${area.replace(/([A-Z])/g, ' $1')} build momentum. You're in week ${this.state.currentChallengeWeek}. You've got this! Try one small part.</p>
                    <p><small>(This is a simulated response.)</small></p>`;
            });
        },
        handleLlmChatSend() { /* ... (no change to core API call logic) ... */
            const userInput = this.elements.llmChatInput.value.trim();
            if (!userInput) return;
            this.elements.llmChatResponse.innerHTML += `<p class="has-text-weight-semibold">You:</p><p>${userInput}</p>`;
            this.elements.llmChatInput.value = '';
            this.elements.llmChatResponse.scrollTop = this.elements.llmChatResponse.scrollHeight;
            fetch(this.LLM_CHAT_API_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userInput, userId: this.state.userData.name }) })
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(data => { this.elements.llmChatResponse.innerHTML += `<p class="has-text-weight-semibold">Bot:</p><p>${data.reply || "I'm here to listen."}</p>`; })
            .catch(error => {
                console.warn("LLM Chat API call failed (expected for simulation):", error);
                this.elements.llmChatResponse.innerHTML += `<p class="has-text-weight-semibold">Bot (Simulated):</p><p>Thanks for sharing, ${this.state.userData.name || 'friend'}. It sounds like you're dealing with something important. What's one small thing you could do now?</p><p><small>(This is a simulated response.)</small></p>`;
            })
            .finally(() => {
                this.elements.llmChatResponse.scrollTop = this.elements.llmChatResponse.scrollHeight;
                 this.addPoints(1, "Used LLM Chat for stress"); this.saveData();
            });
        },

        // --- Modal Handling (Updated for Bulma) ---
        showModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('is-active');
            document.documentElement.classList.add('is-clipped'); // Prevent background scrolling
        },
        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('is-active');
            // Remove is-clipped only if no other modals are active
            const anyModalActive = document.querySelector('.modal.is-active');
            if (!anyModalActive) {
                document.documentElement.classList.remove('is-clipped');
            }
            if (modalId === 'motivateModal') this.elements.motivationMessage.innerHTML = '';
        },

        showEducationModal(title, text) {
            // For Bulma, modal-card-title and content are separate
            const titleEl = this.elements.educationModal.querySelector('.modal-card-title');
            const textEl = this.elements.educationModal.querySelector('.modal-card-body .content p'); // Assuming <p> for text
            if (titleEl) titleEl.textContent = title;
            if (textEl) textEl.textContent = text;
            this.showModal('educationModal');
        },
        checkForMissedDays() { /* ... (no change in logic, just notification type) ... */
            if (!this.state.userData || !this.state.userData.lastLoginDate) return;
            const lastLogin = new Date(this.state.userData.lastLoginDate);
            const today = new Date(this.state.today);
            const diffTime = today - lastLogin;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                this.showInAppNotification(`Welcome back, ${this.state.userData.name}! It's been ${diffDays} days. Glad to see you!`, "is-info", 10000);
            } else if (diffDays === 1 && this.state.userData.lastLoginDate !== this.state.today) {
                 this.showInAppNotification(`Welcome back, ${this.state.userData.name}! Ready for another great day?`, "is-info", 7000);
            }
            this.state.userData.lastLoginDate = this.state.today;
            this.saveData();
        },

    }; // End App Object

    App.init();
});