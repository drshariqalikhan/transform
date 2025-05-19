// script.js
document.addEventListener('DOMContentLoaded', () => {
    const App = {
        // --- DOM Elements ---
        elements: {
            // ... (existing elements) ...
            settingsScreen: document.getElementById('settingsScreen'),
            settingsGearIcon: document.getElementById('settingsGearIcon'),
            darkModeToggle: document.getElementById('darkModeToggle'),
            backToDashboardBtn: document.getElementById('backToDashboardBtn'),
            homeButton: document.getElementById('homeButton'), // For easy nav to welcome/dashboard

            fabContainer: document.querySelector('.fab-container'),
            fabMainBtn: document.getElementById('fabMainBtn'),
            fabCalendarBtn: document.getElementById('fabCalendarBtn'),

            calendarModal: document.getElementById('calendarModal'),
            calendarModalTitle: document.getElementById('calendarModalTitle'),
            calendarMonthYear: document.getElementById('calendarMonthYear'),
            calendarGrid: document.querySelector('#calendarModal .calendar-grid'),
            prevMonthBtn: document.getElementById('prevMonthBtn'),
            nextMonthBtn: document.getElementById('nextMonthBtn'),

            htmlRoot: document.documentElement, // For dark mode class
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
            // ... (existing state) ...
            previousScreen: 'dashboard', // To go back from settings
            calendar: {
                currentDisplayDate: new Date() // For calendar month/year
            },
            swipe: { // For swipe gesture tracking
                touchstartX: 0,
                touchstartY: 0,
                touchendX: 0,
                touchendY: 0,
                activeCard: null,
                threshold: 50, // Minimum horizontal distance for a swipe
                maxVerticalOffset: 75 // Maximum vertical distance to still be considered horizontal swipe
            },
            currentScreen: 'welcome',
            userData: null,
            currentChallengeWeek: 1,
            totalChallengeWeeks: 10,
            today: new Date().toISOString().split('T')[0],
            isDayCompleted: false,
        },

        // --- Constants ---
        DB_KEY: 'bodyAndSoulAppUserBulmaV2', // Incremented for new data structure (swipedHidden)
        // ... (existing constants) ...
        LLM_CHAT_API_ENDPOINT: 'https://api.example.com/llm-chat',
        MOTIVATION_API_ENDPOINT: 'https://api.example.com/motivate',


        // --- Initialization ---
        init() {
            console.log("App Initializing with New Features...");
            this.loadDarkModePreference(); // Load dark mode before anything else
            this.registerServiceWorker();
            this.loadData(); // Now userData is loaded
            this.setupEventListeners();
            this.updateFooterYear();

            // Navigation logic (unchanged, but previousScreen is set here)
            if (this.state.userData && this.state.userData.isRegistered && this.state.userData.hasCompletedBaseline) {
                this.elements.continueChallengeBtn.classList.remove('is-hidden');
                this.elements.startChallengeBtn.textContent = 'Start Over';
                this.navigateTo('dashboard');
                this.state.previousScreen = 'dashboard';
                this.checkForMissedDays();
            } else if (this.state.userData && this.state.userData.isRegistered) {
                this.navigateTo('baseline');
                this.state.previousScreen = 'baseline';
            } else {
                this.navigateTo('welcome');
                this.state.previousScreen = 'welcome';
            }
            this.updateUserDisplay();
            this.requestNotificationPermission();
        },

        // --- Dark Mode ---
        loadDarkModePreference() {
            const darkMode = localStorage.getItem('darkModeEnabled') === 'true';
            this.elements.darkModeToggle.checked = darkMode;
            if (darkMode) {
                this.elements.htmlRoot.classList.add('dark-mode');
            } else {
                this.elements.htmlRoot.classList.remove('dark-mode');
            }
        },

        toggleDarkMode() {
            const isEnabled = this.elements.darkModeToggle.checked;
            if (isEnabled) {
                this.elements.htmlRoot.classList.add('dark-mode');
                localStorage.setItem('darkModeEnabled', 'true');
            } else {
                this.elements.htmlRoot.classList.remove('dark-mode');
                localStorage.setItem('darkModeEnabled', 'false');
            }
        },

        // --- Navigation (Updated) ---
        navigateTo(screenName) {
            const allScreens = ['welcomeScreen', 'registrationScreen', 'baselineScreen', 'dashboardScreen', 'settingsScreen'];
            let currentVisibleScreen = null;
            allScreens.forEach(id => {
                if (this.elements[id] && !this.elements[id].classList.contains('is-hidden')) {
                    currentVisibleScreen = id.replace('Screen', '');
                }
                this.elements[id]?.classList.add('is-hidden');
            });

            if (this.elements[screenName + 'Screen']) {
                this.elements[screenName + 'Screen'].classList.remove('is-hidden');
                if (screenName !== 'settings') { // Don't update previousScreen if going to settings
                    this.state.previousScreen = currentVisibleScreen || this.state.previousScreen;
                }
                this.state.currentScreen = screenName;
                 // Hide FAB on non-dashboard screens initially, show on dashboard
                if (this.elements.fabContainer) {
                    if (screenName === 'dashboard') {
                        this.elements.fabContainer.classList.remove('is-hidden');
                    } else {
                        this.elements.fabContainer.classList.add('is-hidden');
                        if(this.elements.fabContainer.classList.contains('is-active')) { // Close FAB if open
                            this.elements.fabContainer.classList.remove('is-active');
                        }
                    }
                }
            } else { /* ... error handling ... */ }

            if (screenName === 'dashboard') this.renderDashboard();
        },

        // --- Event Listeners Setup (Updated) ---
        setupEventListeners() {
            // ... (existing listeners for start, continue, forms, modals, completeDay, dismissNotification) ...
            this.elements.settingsGearIcon.addEventListener('click', () => this.navigateTo('settings'));
            this.elements.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
            this.elements.backToDashboardBtn.addEventListener('click', () => this.navigateTo(this.state.previousScreen || 'dashboard'));
            this.elements.homeButton.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent # href navigation
                // Smart home: if registered and baseline done, go to dashboard, else welcome
                 if (this.state.userData && this.state.userData.isRegistered && this.state.userData.hasCompletedBaseline) {
                    this.navigateTo('dashboard');
                } else {
                    this.navigateTo('welcome');
                }
            });


            // FAB Menu Listeners
            this.elements.fabMainBtn.addEventListener('click', () => {
                this.elements.fabContainer.classList.toggle('is-active');
            });
            this.elements.fabCalendarBtn.addEventListener('click', () => {
                this.renderCalendar(); // Render for current month
                this.showModal('calendarModal');
                this.elements.fabContainer.classList.remove('is-active'); // Close FAB
            });

            // Calendar Modal Navigation
            this.elements.prevMonthBtn.addEventListener('click', () => this.changeCalendarMonth(-1));
            this.elements.nextMonthBtn.addEventListener('click', () => this.changeCalendarMonth(1));
            
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

            // Delegate touch events for swipe from the tasks container
            this.elements.dailyTasksContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
            this.elements.dailyTasksContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);
            this.elements.dailyTasksContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);
            // ... other listeners ...
            this.elements.startChallengeBtn.addEventListener('click', () => {
                if (this.state.userData && this.state.userData.isRegistered && this.state.userData.hasCompletedBaseline) {
                    if (confirm("Are you sure you want to start over? All progress will be lost.")) {
                        this.state.userData = this.getDefaultUserData(); this.saveData(); this.navigateTo('registration');
                    }
                } else { this.navigateTo('registration'); }
            });
            this.elements.continueChallengeBtn.addEventListener('click', () => this.navigateTo('dashboard'));
            this.elements.registrationForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleRegistration(); });
            this.elements.baselineForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleBaseline(); });
            this.elements.motivateMeBtn.addEventListener('click', () => this.showModal('motivateModal'));
            this.elements.getMotivationBtn.addEventListener('click', () => this.handleGetMotivation());
            this.elements.sendToLlmBtn.addEventListener('click', () => this.handleLlmChatSend());
            this.elements.completeDayBtn.addEventListener('click', () => this.handleCompleteDay());
            this.elements.dismissNotificationBtn.addEventListener('click', () => this.elements.inAppNotification.classList.add('is-hidden'));
        },

        // --- Swipe to Hide Logic ---
        handleTouchStart(event) {
            const card = event.target.closest('.task-card.completed-task.is-swipable'); // Only swipable if completed
            if (!card) return;

            this.state.swipe.activeCard = card;
            this.state.swipe.touchstartX = event.changedTouches[0].screenX;
            this.state.swipe.touchstartY = event.changedTouches[0].screenY;
            // event.preventDefault(); // Be careful with this, might prevent scrolling if not a swipe
        },

        handleTouchMove(event) {
            if (!this.state.swipe.activeCard) return;
            // event.preventDefault(); // Prevent scroll while swiping horizontally

            const touchcurrentX = event.changedTouches[0].screenX;
            const deltaX = touchcurrentX - this.state.swipe.touchstartX;

            // Only apply transform if swipe is predominantly horizontal
            const touchcurrentY = event.changedTouches[0].screenY;
            const deltaY = Math.abs(touchcurrentY - this.state.swipe.touchstartY);

            if (deltaX < 0 && deltaY < this.state.swipe.maxVerticalOffset) { // Swiping left and mostly horizontal
                 event.preventDefault(); // Prevent vertical scroll if it's a horizontal swipe
                this.state.swipe.activeCard.classList.add('is-swiping');
                this.state.swipe.activeCard.style.transform = `translateX(${deltaX}px)`;
            } else {
                // Reset if swipe becomes too vertical or goes right
                this.state.swipe.activeCard.classList.remove('is-swiping');
                this.state.swipe.activeCard.style.transform = '';
                // this.state.swipe.activeCard = null; // Uncomment if you want to cancel swipe early
            }
        },

        handleTouchEnd(event) {
            if (!this.state.swipe.activeCard) return;

            this.state.swipe.touchendX = event.changedTouches[0].screenX;
            const deltaX = this.state.swipe.touchendX - this.state.swipe.touchstartX;
            const card = this.state.swipe.activeCard;

            card.classList.remove('is-swiping');
            card.style.transform = ''; // Reset style for CSS animation

            if (deltaX < -this.state.swipe.threshold) { // Swiped left enough
                card.classList.add('is-hiding-swipe');
                const taskKey = card.id.replace('-task', ''); // e.g., 'sleep' from 'sleep-task'
                
                // Update data model
                const todayLog = this.getTodayLog();
                if (todayLog && todayLog.tasksCompleted && todayLog.tasksCompleted[taskKey]) {
                    if (typeof todayLog.tasksCompleted[taskKey] !== 'object') { // If it was just a boolean
                         todayLog.tasksCompleted[taskKey] = { completed: true, swipedHidden: true };
                    } else {
                        todayLog.tasksCompleted[taskKey].swipedHidden = true;
                    }
                    this.saveData();
                }

                // Remove from DOM after animation
                setTimeout(() => {
                    card.parentElement.classList.add('is-hidden'); // Hide the column
                }, 300); // Match CSS transition duration
            }
            this.state.swipe.activeCard = null;
        },

        // In renderDashboard or addCardToDashboard, check swipedHidden
        addCardToDashboard(id, innerHTML, columnClass = 'is-one-third-tablet is-half-mobile') {
            const taskKey = id.replace('-task', '');
            const todayLog = this.getTodayLog();
            let isSwipedHidden = false;
            if (todayLog && todayLog.tasksCompleted && todayLog.tasksCompleted[taskKey]) {
                 isSwipedHidden = (typeof todayLog.tasksCompleted[taskKey] === 'object' && todayLog.tasksCompleted[taskKey].swipedHidden);
            }

            const columnDiv = document.createElement('div');
            columnDiv.className = `column ${columnClass}`;
            if (isSwipedHidden) {
                columnDiv.classList.add('is-hidden'); // Hide immediately if already swiped
            }

            const card = document.createElement('div');
            card.id = id; // e.g., sleep-task
            card.className = 'card task-card mb-3';
            card.innerHTML = innerHTML;
            
            // Add 'is-swipable' class if the task is marked as completed
            // This check should happen AFTER the card's content (including checkbox) is set up
            // For now, let's add it based on existing log. Better to update it when checkbox is checked/unchecked.
            // Updated in checkTaskCompletion.

            columnDiv.appendChild(card);
            this.elements.dailyTasksContainer.appendChild(columnDiv);
        },

        checkTaskCompletion(taskKey, isSubstantiallyFilled) {
            const todayLog = this.getTodayLog();
            todayLog.tasksCompleted = todayLog.tasksCompleted || {};
            
            // Preserve swipedHidden status if it exists
            let currentStatus = todayLog.tasksCompleted[taskKey];
            let wasSwipedHidden = false;
            if (typeof currentStatus === 'object') {
                wasSwipedHidden = currentStatus.swipedHidden || false;
            }

            todayLog.tasksCompleted[taskKey] = {
                completed: isSubstantiallyFilled,
                swipedHidden: wasSwipedHidden // Retain if unchecking
            };

            const mainCheckbox = document.getElementById(`${taskKey}TaskDone`);
            if (mainCheckbox) mainCheckbox.checked = isSubstantiallyFilled;
            
            const card = document.getElementById(`${taskKey}-task`);
            if(card) {
                if(isSubstantiallyFilled) {
                    card.classList.add('completed-task', 'is-swipable'); // Make it swipable
                } else {
                    card.classList.remove('completed-task', 'is-swipable');
                    // If uncompleted, it should not be swiped hidden anymore
                    if (todayLog.tasksCompleted[taskKey].swipedHidden) {
                        todayLog.tasksCompleted[taskKey].swipedHidden = false;
                        card.parentElement.classList.remove('is-hidden'); // Show column
                        card.classList.remove('is-hiding-swipe'); // Reset visual state
                    }
                }
            }
            this.saveData();
            this.checkDayCompletionStatus();
        },
        updateTaskCheckboxState(taskKey, forceState = undefined) {
            const todayLog = this.getTodayLog();
            if (!todayLog || !todayLog.tasksCompleted) return;

            let taskStatus = todayLog.tasksCompleted[taskKey];
            let isComplete;

            if (typeof taskStatus === 'object') {
                isComplete = forceState !== undefined ? forceState : taskStatus.completed;
            } else {
                isComplete = forceState !== undefined ? forceState : taskStatus || false;
            }

            const mainCheckbox = document.getElementById(`${taskKey}TaskDone`);
            if (mainCheckbox) mainCheckbox.checked = isComplete;
            
            const card = document.getElementById(`${taskKey}-task`);
            if (card) {
                 if(isComplete) card.classList.add('completed-task', 'is-swipable');
                 else card.classList.remove('completed-task', 'is-swipable');

                 // If it was swiped hidden but is no longer complete, unhide it
                 if (!isComplete && typeof taskStatus === 'object' && taskStatus.swipedHidden) {
                     card.parentElement.classList.remove('is-hidden');
                     card.classList.remove('is-hiding-swipe');
                     todayLog.tasksCompleted[taskKey].swipedHidden = false; // Update data
                     this.saveData();
                 }
            }
        },


        // --- Calendar Logic ---
        renderCalendar(dateToDisplay = this.state.calendar.currentDisplayDate) {
            this.state.calendar.currentDisplayDate = new Date(dateToDisplay); // Ensure it's a new Date object
            const year = this.state.calendar.currentDisplayDate.getFullYear();
            const month = this.state.calendar.currentDisplayDate.getMonth(); // 0-indexed

            this.elements.calendarMonthYear.textContent = `${this.state.calendar.currentDisplayDate.toLocaleString('default', { month: 'long' })} ${year}`;
            
            // Clear previous days, but keep headers
            const dayCells = this.elements.calendarGrid.querySelectorAll('.calendar-day');
            dayCells.forEach(cell => cell.remove());

            const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, ...
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Add empty cells for days before the first of the month
            for (let i = 0; i < firstDayOfMonth; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('calendar-day', 'is-other-month');
                this.elements.calendarGrid.appendChild(emptyCell);
            }

            // Add day cells
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('calendar-day');
                dayCell.textContent = day;
                
                const currentDate = new Date(year, month, day);
                const dateKey = currentDate.toISOString().split('T')[0];

                if (this.state.userData.dailyLogs[dateKey] && this.state.userData.dailyLogs[dateKey].dayCompleted) {
                    dayCell.classList.add('is-completed-day');
                }
                if (dateKey === this.state.today) {
                    dayCell.classList.add('is-today');
                }
                this.elements.calendarGrid.appendChild(dayCell);
            }
        },

        changeCalendarMonth(monthOffset) {
            this.state.calendar.currentDisplayDate.setMonth(this.state.calendar.currentDisplayDate.getMonth() + monthOffset);
            this.renderCalendar();
        },

        // --- getDefaultUserData (add default for task completion object) ---
        getDefaultUserData() {
            return {
                // ... (other properties) ...
                name: '', age: null, gender: '', initialWeight: null, currentWeight: null,
                height: null, idealWeight: null, caloricDeficitTarget: null,
                baselineCardio: '', baselineStrength: '', exerciseTrack: 'beginner',
                isRegistered: false, hasCompletedBaseline: false, startDate: null,
                currentChallengeWeek: 1, lastLoginDate: this.state.today, 
                dailyLogs: {}, // { 'YYYY-MM-DD': { sleep: { completed: false, swipedHidden: false }, ... dayCompleted: false } }
                points: 0, badges: [],
                makeMeQuit: { behavior: null, trigger: null, substitution: null, log: {} },
                peaceOfMind: { moodStressLog: {}, gratitudeLog: {} }
            };
        },
        // All other functions (PWA, data management, existing task logic, modals) remain largely the same
        // unless they interact with the new features.
        registerServiceWorker() { /* ... (no change) ... */ },
        requestNotificationPermission() { /* ... (no change) ... */ },
        sendNotification(title, body) { /* ... (no change) ... */ },
        showInAppNotification(message, type = 'is-info', duration = 5000) { /* ... (no change) ... */ },
        loadData() {
            const data = localStorage.getItem(this.DB_KEY);
            if (data) {
                this.state.userData = JSON.parse(data);
                this.state.userData.dailyLogs = this.state.userData.dailyLogs || {};
                // Ensure task completion is an object for new structure
                Object.keys(this.state.userData.dailyLogs).forEach(dateKey => {
                    const log = this.state.userData.dailyLogs[dateKey];
                    if (log.tasksCompleted) {
                        Object.keys(log.tasksCompleted).forEach(taskKey => {
                            if (typeof log.tasksCompleted[taskKey] === 'boolean') {
                                log.tasksCompleted[taskKey] = { completed: log.tasksCompleted[taskKey], swipedHidden: false };
                            }
                        });
                    }
                });

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
            try { localStorage.setItem(this.DB_KEY, JSON.stringify(this.state.userData)); this.updateUserDisplay(); }
            catch (e) { console.error("Error saving data:", e); this.showInAppNotification("Could not save progress.", "is-danger"); }
        },
        updateUserDisplay() { /* ... (no change) ... */ },
        handleRegistration() { /* ... (no change) ... */ },
        handleBaseline() { /* ... (no change) ... */ },
        renderDashboard() { /* ... (no change except FAB visibility is handled in navigateTo) ... */
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
        updateCurrentWeek() { /* ... (no change) ... */ },
        getTodayLog(createIfNotExist = false) {
             if (!this.state.userData.dailyLogs[this.state.today] && createIfNotExist) {
                this.state.userData.dailyLogs[this.state.today] = {
                    sleep: { bedtime: '', waketime: '', targetMet: null, duration: null },
                    weightControl: { mealtimes: '', water: '', food: '', nonWaterDrinks: '', junkFoodStopped: false, fruitSnacks: false, mealTimesAdhered: false, caloriesTracked: null },
                    exerciseCompleted: false, // Will be converted to object by checkTaskCompletion if needed
                    peaceOfMind: { mindfulnessCompleted: false, moodBefore: null, stressBefore: null, moodAfter: null, stressAfter: null, breathingCompleted: false, enjoyableActivityCompleted: false },
                    makeMeQuit: { instancesLogged: null, contextLogged: '', triggerAvoided: false, substitutionPracticed: false },
                    tasksCompleted: {}, // Store completion status as { completed: boolean, swipedHidden: boolean }
                    dayCompleted: false
                };
            }
            // Ensure tasksCompleted items are objects
            const log = this.state.userData.dailyLogs[this.state.today];
            if(log && log.tasksCompleted){
                Object.keys(log.tasksCompleted).forEach(taskKey => {
                    if(typeof log.tasksCompleted[taskKey] === 'boolean'){
                        log.tasksCompleted[taskKey] = { completed: log.tasksCompleted[taskKey], swipedHidden: false };
                    }
                });
            }
            return this.state.userData.dailyLogs[this.state.today];
        },
        // Task rendering functions (renderSleepTask, etc.) now call the updated addCardToDashboard
        // The core logic inside them remains the same for generating Bulma-styled inputs.
        // Example of how one task render function calls addCardToDashboard
        renderSleepTask() {
            const W = this.state.currentChallengeWeek;
            const todayLogFull = this.getTodayLog(true); // get full day log
            const todayLog = todayLogFull.sleep; // specific task log
            let taskStatus = todayLogFull.tasksCompleted?.sleep || { completed: false, swipedHidden: false };

            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="sleepTaskDone" data-task="sleep" ${taskStatus.completed ? 'checked':''}>Sleep</label></p></div>
                           <div class="card-content content">`;
            if (W === 1) { /* ... W1 content ... */
                 content += `<div class="field"><label class="label is-small" for="bedtime">Bedtime:</label><div class="control"><input class="input is-small" type="time" id="bedtime" value="${todayLog.bedtime || ''}"></div></div><div class="field"><label class="label is-small" for="waketime">Wake-up Time:</label><div class="control"><input class="input is-small" type="time" id="waketime" value="${todayLog.waketime || ''}"></div></div>`;
            } else { /* ... W2+ content ... */
                const targetBedtime = this.state.userData.sleepTargetBedtime || "22:30"; const targetWaketime = this.state.userData.sleepTargetWaketime || "06:30";
                content += `<p class="is-size-7">Target: Bed by ${targetBedtime}, Awake by ${targetWaketime}</p><div class="field"><label class="label is-small" for="bedtime">Actual Bedtime:</label><div class="control"><input class="input is-small" type="time" id="bedtime" value="${todayLog.bedtime || ''}"></div></div><div class="field"><label class="label is-small" for="waketime">Actual Wake-up Time:</label><div class="control"><input class="input is-small" type="time" id="waketime" value="${todayLog.waketime || ''}"></div></div><div id="sleepTargetStatus" class="task-display">Status: ${todayLog.targetMet === null ? 'Enter times' : (todayLog.targetMet ? 'Goal Met!' : 'Goal Missed')}</div>`;
            }
            content += `<div id="sleepDurationDisplay" class="task-display">Total Sleep: ${todayLog.duration || 'N/A'}</div></div>`;
            this.addCardToDashboard('sleep-task', content); // Column class defaults or can be passed
            document.getElementById('bedtime').addEventListener('change', (e) => this.updateSleepData('bedtime', e.target.value));
            document.getElementById('waketime').addEventListener('change', (e) => this.updateSleepData('waketime', e.target.value));
            this.updateTaskCheckboxState('sleep'); // Ensure swipable class is set if needed
        },
        updateSleepData(field, value) { /* ... (no change) ... */ },
        // ... Other task render and update functions (renderWeightControlTask, etc.) would similarly get taskStatus for checkbox and call addCardToDashboard ...
        renderWeightControlTask() { /* ... update to get taskStatus & pass to checkbox ... */
            const W = this.state.currentChallengeWeek; const todayLogFull = this.getTodayLog(true); const todayLog = todayLogFull.weightControl; const userData = this.state.userData;
            let taskStatus = todayLogFull.tasksCompleted?.weightControl || { completed: false, swipedHidden: false };
            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="weightControlTaskDone" data-task="weightControl" ${taskStatus.completed ? 'checked':''}>Weight Control</label></p></div><div class="card-content content">`;
            if (W === 1) { content += `<p class="is-size-7">Ideal: ${userData.idealWeight} kg. Deficit: ${userData.caloricDeficitTarget} kcal.</p><div class="field"><label class="label is-small" for="wcMealTimes">Mealtimes:</label><div class="control"><input class="input is-small" type="text" id="wcMealTimes" placeholder="8am, 1pm, 6pm" value="${todayLog.mealtimes || ''}"></div></div><div class="field"><label class="label is-small" for="wcWater">Water (L):</label><div class="control"><input class="input is-small" type="number" step="0.1" id="wcWater" placeholder="2.5" value="${todayLog.water || ''}"></div></div><div class="field"><label class="label is-small" for="wcFood">Food Log:</label><div class="control"><textarea class="textarea is-small" id="wcFood" rows="2" placeholder="Oats, Chicken salad...">${todayLog.food || ''}</textarea></div></div><div class="field"><label class="label is-small" for="wcNonWaterDrinks">Non-water drinks:</label><div class="control"><input class="input is-small" type="text" id="wcNonWaterDrinks" placeholder="1 coffee, 1 soda" value="${todayLog.nonWaterDrinks || ''}"></div></div>`; }
            else if (W === 2) { content += `<p class="is-size-7">Continue tracking. Reduce junk, use fruit snacks, set meal times.</p>${this.renderWeightControlTaskInputs(todayLog)}<div class="task-item"><label class="checkbox"><input type="checkbox" id="wcJunkFood" ${todayLog.junkFoodStopped ? 'checked' : ''}> Stop non-water/junk food.</label></div><div class="task-item"><label class="checkbox"><input type="checkbox" id="wcFruitSnacks" ${todayLog.fruitSnacks ? 'checked' : ''}> Replace snacks with fruits.</label></div><div class="task-item"><label class="checkbox"><input type="checkbox" id="wcMealTimesAdhered" ${todayLog.mealTimesAdhered ? 'checked' : ''}> Adhere to set meal times.</label></div>`; }
            else { content += `<p class="is-size-7">Continue tracking. Maintain ${userData.caloricDeficitTarget} kcal deficit.</p>${this.renderWeightControlTaskInputs(todayLog)}<div class="field"><label class="label is-small" for="wcCalories">Est. Calories:</label><div class="control"><input class="input is-small" type="number" id="wcCalories" placeholder="1800" value="${todayLog.caloriesTracked || ''}"></div></div><p class="task-display">Daily calorie goal (approx): ${this.calculateDailyCalorieGoal()} kcal</p>`; }
            content += `</div>`; this.addCardToDashboard('weight-control-task', content);
            document.getElementById('wcMealTimes')?.addEventListener('input', (e) => this.updateWeightLog('mealtimes', e.target.value)); /* ... other listeners */
            document.getElementById('wcWater')?.addEventListener('input', (e) => this.updateWeightLog('water', e.target.value));
            document.getElementById('wcFood')?.addEventListener('input', (e) => this.updateWeightLog('food', e.target.value));
            document.getElementById('wcNonWaterDrinks')?.addEventListener('input', (e) => this.updateWeightLog('nonWaterDrinks', e.target.value));
            document.getElementById('wcJunkFood')?.addEventListener('change', (e) => this.updateWeightLog('junkFoodStopped', e.target.checked, 2));
            document.getElementById('wcFruitSnacks')?.addEventListener('change', (e) => this.updateWeightLog('fruitSnacks', e.target.checked, 2));
            document.getElementById('wcMealTimesAdhered')?.addEventListener('change', (e) => this.updateWeightLog('mealTimesAdhered', e.target.checked, 2));
            document.getElementById('wcCalories')?.addEventListener('input', (e) => this.updateWeightLog('caloriesTracked', e.target.value, 5));
            this.updateTaskCheckboxState('weightControl');
        },
        renderWeightControlTaskInputs(todayLog) { /* ... */ return `<div class="field"><label class="label is-small" for="wcMealTimes">Mealtimes:</label><div class="control"><input class="input is-small" type="text" id="wcMealTimes" value="${todayLog.mealtimes || ''}"></div></div> <div class="field"><label class="label is-small" for="wcWater">Water (L):</label><div class="control"><input class="input is-small" type="number" step="0.1" id="wcWater" value="${todayLog.water || ''}"></div></div> <div class="field"><label class="label is-small" for="wcFood">Food Log:</label><div class="control"><textarea class="textarea is-small" id="wcFood" rows="2">${todayLog.food || ''}</textarea></div></div> <div class="field"><label class="label is-small" for="wcNonWaterDrinks">Non-water drinks:</label><div class="control"><input class="input is-small" type="text" id="wcNonWaterDrinks" value="${todayLog.nonWaterDrinks || ''}"></div></div>`; },
        calculateDailyCalorieGoal() { /* ... */ return (this.state.userData.gender === 'female' ? 1800 : 2200) - (this.state.userData.caloricDeficitTarget || 500); },
        updateWeightLog(field, value, points = 1) { /* ... */ },
        isWeightControlTaskSubstantiallyFilled() { /* ... */ },
        renderExerciseTask() { /* ... update to get taskStatus & pass to checkbox ... */
            const W = this.state.currentChallengeWeek; const todayLogFull = this.getTodayLog(true); const todayLog = todayLogFull; // exerciseCompleted is directly on day log for now
            const track = this.state.userData.exerciseTrack; let routine = this.getExerciseRoutine(W, track, this.state.userData.gender, this.state.userData.age);
            let taskStatus = todayLogFull.tasksCompleted?.exercise || { completed: todayLog.exerciseCompleted, swipedHidden: false }; // Adapt if exerciseCompleted moves into tasksCompleted object
             if (typeof taskStatus.completed === 'undefined') taskStatus.completed = todayLog.exerciseCompleted; // backward compat

            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="exerciseTaskDone" data-task="exercise" ${taskStatus.completed ? 'checked' : ''}>Exercise</label></p></div> <div class="card-content content"> <p class="is-size-7">Track: <span class="tag is-info is-light">${track.charAt(0).toUpperCase() + track.slice(1)}</span></p> <p class="is-size-6 has-text-weight-semibold">Cardio:</p> <p class="is-size-7">${routine.cardio}</p> <p class="is-size-6 has-text-weight-semibold">Strength:</p> <p class="is-size-7">${routine.strength}</p> <div class="task-item mt-3"><label class="checkbox"><input type="checkbox" id="exerciseCompletedCheck" ${taskStatus.completed ? 'checked' : ''}> Mark as completed</label></div> </div>`;
            this.addCardToDashboard('exercise-task', content);
            document.getElementById('exerciseCompletedCheck').addEventListener('change', (e) => {
                todayLogFull.exerciseCompleted = e.target.checked; // Keep this for direct access if needed, also update tasksCompleted
                if(e.target.checked) this.addPoints(10, "Exercise Completed");
                this.saveData();
                this.checkTaskCompletion('exercise', e.target.checked);
            });
            this.updateTaskCheckboxState('exercise', taskStatus.completed);
        },
        getExerciseRoutine(week, track, gender, age) { /* ... */ },
        renderPeaceOfMindTask() { /* ... update to get taskStatus & pass to checkbox ... */
            const W = this.state.currentChallengeWeek; const todayLogFull = this.getTodayLog(true); const todayLogPOM = todayLogFull.peaceOfMind;
            let taskStatus = todayLogFull.tasksCompleted?.peaceOfMind || { completed: false, swipedHidden: false };
            // Determine if PoM is complete based on sub-tasks for checkbox
            taskStatus.completed = this.isPeaceOfMindTaskSubstantiallyFilled();


            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="peaceOfMindTaskDone" data-task="peaceOfMind" ${taskStatus.completed ? 'checked':''}>Peace of Mind</label></p></div> <div class="card-content content">`;
            content += `<div class="task-item"><label class="checkbox"><input type="checkbox" id="pomMindfulness" ${todayLogPOM.mindfulnessCompleted ? 'checked' : ''}> 1-min Mindfulness.</label><button class="button is-small is-outlined is-primary ml-2" id="startMindfulnessTimerBtn">Timer</button><span id="mindfulnessTimerDisplay" class="is-size-7 ml-1"></span></div>`;
            content += `<div class="mt-2"><label class="label is-small mb-0">Mood (1-10):</label> Before: <input type="number" min="1" max="10" id="pomMoodBefore" class="input is-small small-input" value="${todayLogPOM.moodBefore || ''}"> After: <input type="number" min="1" max="10" id="pomMoodAfter" class="input is-small small-input" value="${todayLogPOM.moodAfter || ''}"></div>`;
            content += `<div class="mt-1"><label class="label is-small mb-0">Stress (1-10):</label> Before: <input type="number" min="1" max="10" id="pomStressBefore" class="input is-small small-input" value="${todayLogPOM.stressBefore || ''}"> After: <input type="number" min="1" max="10" id="pomStressAfter" class="input is-small small-input" value="${todayLogPOM.stressAfter || ''}"></div>`;
            content += `<div class="task-item mt-2"><label class="checkbox"><input type="checkbox" id="pomBreathing" ${todayLogPOM.breathingCompleted ? 'checked' : ''}> Breathing exercises.</label> <button class="button is-small is-outlined is-info ml-2" data-education="breathing">Info</button></div>`;
            content += `<div class="task-item mt-2">Talk about stress triggers.<button class="button is-small is-outlined is-link ml-2" id="openLlmChatBtn">Chat</button></div>`;
            content += `<div class="task-item mt-2"><label class="checkbox"><input type="checkbox" id="pomEnjoyableActivity" ${todayLogPOM.enjoyableActivityCompleted ? 'checked' : ''}> 30 mins enjoyable activity.</label></div>`;
            if (W >= 2) { const gratitudeLog = this.state.userData.peaceOfMind.gratitudeLog; const gratitudeKey = `week${W}`; content += `<hr><p class="has-text-weight-semibold is-size-7">Weekly Gratitude:</p><textarea id="pomGratitude" class="textarea is-small" rows="2" placeholder="One thing grateful for...">${gratitudeLog[gratitudeKey] || ''}</textarea>`; }
            content += `</div>`; this.addCardToDashboard('peace-of-mind-task', content);
             /* ... event listeners ... */
            document.getElementById('startMindfulnessTimerBtn').addEventListener('click', () => this.startMindfulnessTimer());
            document.getElementById('pomMindfulness').addEventListener('change', (e) => this.updatePeaceOfMindLog('mindfulnessCompleted', e.target.checked, 2));
            document.getElementById('pomMoodBefore').addEventListener('input', (e) => this.updatePeaceOfMindLog('moodBefore', e.target.value));
            document.getElementById('pomMoodAfter').addEventListener('input', (e) => this.updatePeaceOfMindLog('moodAfter', e.target.value));
            document.getElementById('pomStressBefore').addEventListener('input', (e) => this.updatePeaceOfMindLog('stressBefore', e.target.value));
            document.getElementById('pomStressAfter').addEventListener('input', (e) => this.updatePeaceOfMindLog('stressAfter', e.target.value));
            document.getElementById('pomBreathing').addEventListener('change', (e) => this.updatePeaceOfMindLog('breathingCompleted', e.target.checked, 2));
            document.getElementById('openLlmChatBtn').addEventListener('click', () => this.showModal('llmChatModal'));
            document.getElementById('pomEnjoyableActivity').addEventListener('change', (e) => this.updatePeaceOfMindLog('enjoyableActivityCompleted', e.target.checked, 3));
            if (document.getElementById('pomGratitude')) { document.getElementById('pomGratitude').addEventListener('input', (e) => this.updateGratitudeLog(e.target.value)); }
            document.querySelector('button[data-education="breathing"]').addEventListener('click', () => { this.showEducationModal( "Breathing Exercise: Box Breathing", "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat for 2-5 minutes. This calms the nervous system." ); });
            this.updateTaskCheckboxState('peaceOfMind');
        },
        startMindfulnessTimer() { /* ... */ },
        updatePeaceOfMindLog(field, value, points = 1) { /* ... calls checkTaskCompletion('peaceOfMind', this.isPeaceOfMindTaskSubstantiallyFilled()); ... */
            const todayLogPOM = this.getTodayLog().peaceOfMind; todayLogPOM[field] = value;
            if(value === true || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && !isNaN(value))) {
                if (field.endsWith('Completed') && value === true) this.addPoints(points, `Peace of Mind: ${field}`);
                else if (!field.endsWith('Completed')) this.addPoints(0.5, `Peace of Mind: ${field} logged`);
            } this.saveData(); this.checkTaskCompletion('peaceOfMind', this.isPeaceOfMindTaskSubstantiallyFilled()); // This will update the main checkbox
        },
        updateGratitudeLog(value) { /* ... */ },
        isPeaceOfMindTaskSubstantiallyFilled() { /* ... */
            const log = this.getTodayLog().peaceOfMind; return log.mindfulnessCompleted && log.breathingCompleted && log.enjoyableActivityCompleted && log.moodBefore && log.stressBefore && log.moodAfter && log.stressAfter;
        },
        renderMakeMeQuitTask() { /* ... update to get taskStatus & pass to checkbox ... */
            const W = this.state.currentChallengeWeek; const mmqData = this.state.userData.makeMeQuit; const todayLogFull = this.getTodayLog(true); const todayLogMMQ = todayLogFull.makeMeQuit;
            let taskStatus = todayLogFull.tasksCompleted?.makeMeQuit || { completed: false, swipedHidden: false };
            taskStatus.completed = this.isMakeMeQuitTaskSubstantiallyFilled(); // Determine based on sub-tasks

            let content = `<div class="card-header"><p class="card-header-title"><label class="checkbox mr-2"><input type="checkbox" id="makeMeQuitTaskDone" data-task="makeMeQuit" ${taskStatus.completed ? 'checked':''}>Make Me Quit</label></p></div> <div class="card-content content">`;
            if (!mmqData.behavior && W >= 1) { content += `<p class="is-size-7">Identify one unhealthy behavior to change.</p><div class="field"><label class="label is-small" for="mmqBehaviorInput">Behavior to Quit:</label><div class="control"><input class="input is-small" type="text" id="mmqBehaviorInput" placeholder="e.g., mindless snacking after 8pm"></div></div>`; }
            else { content += `<p class="is-size-7">Focus: Modifying "<strong>${mmqData.behavior || 'Not Set'}</strong>"</p>`; }
            if (mmqData.behavior) {
                if (W === 1) { content += `<p class="is-size-7"><strong>W1 (Awareness):</strong> Track instances and context.</p>${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`; }
                else if (W === 2) { if (!mmqData.trigger) { content += `<p class="is-size-7"><strong>W2 (Identify Trigger):</strong> Based on last week, identify a trigger.</p><div class="field"><label class="label is-small" for="mmqTriggerInput">Identify Trigger:</label><div class="control"><input class="input is-small" type="text" id="mmqTriggerInput" placeholder="e.g., opening fridge when bored"></div></div>`; } else { content += `<p class="is-size-7">Trigger: "<strong>${mmqData.trigger}</strong>". Continue logging.</p>${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`; } }
                else if (W === 3) { if (!mmqData.trigger) content += `<p class="is-size-7">Please identify trigger first (W2 task).</p>`; else content += `<p class="is-size-7"><strong>W3 (Limit Exposure):</strong> Limit exposure to "<strong>${mmqData.trigger}</strong>".</p><div class="task-item"><label class="checkbox"><input type="checkbox" id="mmqTriggerAvoided" ${todayLogMMQ.triggerAvoided ? 'checked' : ''}> I worked on limiting trigger exposure.</label></div>${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`; }
                else { if (!mmqData.trigger) content += `<p class="is-size-7">Identify trigger first (W2 task).</p>`; else if (!mmqData.substitution) { content += `<p class="is-size-7"><strong>W4+ (Substitution):</strong> Plan substitution for "${mmqData.trigger}".</p><div class="field"><label class="label is-small" for="mmqSubstitutionInput">Substitution Behavior:</label><div class="control"><input class="input is-small" type="text" id="mmqSubstitutionInput" placeholder="e.g., drink water, 5 squats"></div></div>${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`; } else { content += `<p class="is-size-7"><strong>W4-10 (Practice):</strong> Practice "<strong>${mmqData.substitution}</strong>" for "<strong>${mmqData.trigger}</strong>".</p><div class="task-item"><label class="checkbox"><input type="checkbox" id="mmqSubstitutionPracticed" ${todayLogMMQ.substitutionPracticed ? 'checked' : ''}> I practiced my substitution.</label></div>${this.renderMMQWeek1InputsBulma(todayLogMMQ)}`; } }
            } content += `</div>`; this.addCardToDashboard('make-me-quit-task', content);
            /* ... event listeners ... */
            document.getElementById('mmqBehaviorInput')?.addEventListener('change', (e) => this.updateMMQData('behavior', e.target.value));
            document.getElementById('mmqInstances')?.addEventListener('input', (e) => this.updateMMQLog('instancesLogged', parseInt(e.target.value) || 0));
            document.getElementById('mmqContext')?.addEventListener('input', (e) => this.updateMMQLog('contextLogged', e.target.value));
            document.getElementById('mmqTriggerInput')?.addEventListener('change', (e) => this.updateMMQData('trigger', e.target.value, 5));
            document.getElementById('mmqTriggerAvoided')?.addEventListener('change', (e) => this.updateMMQLog('triggerAvoided', e.target.checked, 3));
            document.getElementById('mmqSubstitutionInput')?.addEventListener('change', (e) => this.updateMMQData('substitution', e.target.value, 5));
            document.getElementById('mmqSubstitutionPracticed')?.addEventListener('change', (e) => this.updateMMQLog('substitutionPracticed', e.target.checked, 3));
            this.updateTaskCheckboxState('makeMeQuit');
        },
        renderMMQWeek1InputsBulma(todayLogMMQ) { /* ... */ return `<div class="field mt-2"><label class="label is-small" for="mmqInstances">Times today:</label><div class="control"><input class="input is-small" type="number" id="mmqInstances" min="0" value="${todayLogMMQ.instancesLogged !== null ? todayLogMMQ.instancesLogged : ''}"></div></div> <div class="field"><label class="label is-small" for="mmqContext">Context/Notes:</label><div class="control"><textarea class="textarea is-small" id="mmqContext" rows="2">${todayLogMMQ.contextLogged || ''}</textarea></div></div>`; },
        updateMMQData(field, value, points = 0) { /* ... calls this.renderDashboard() ... */ },
        updateMMQLog(field, value, points = 1) { /* ... calls checkTaskCompletion('makeMeQuit', this.isMakeMeQuitTaskSubstantiallyFilled()); ... */
            const todayLogMMQ = this.getTodayLog().makeMeQuit; todayLogMMQ[field] = value;
            if ((value === true) || (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && value >=0)) {
                 if (field.endsWith('Practiced') && value === true) this.addPoints(points, `MakeMeQuit: ${field}`);
                 else if (field.endsWith('Avoided') && value === true) this.addPoints(points, `MakeMeQuit: ${field}`);
                 else if (field.includes('Logged')) this.addPoints(points, `MakeMeQuit: Logged`);
            } this.saveData(); this.checkTaskCompletion('makeMeQuit', this.isMakeMeQuitTaskSubstantiallyFilled());
        },
        isMakeMeQuitTaskSubstantiallyFilled() { /* ... */
            const W = this.state.currentChallengeWeek; const log = this.getTodayLog().makeMeQuit; const data = this.state.userData.makeMeQuit; if (!data.behavior) return false; if (W === 1) return typeof log.instancesLogged === 'number' && log.contextLogged !== undefined; if (W === 2) return data.trigger && typeof log.instancesLogged === 'number'; if (W === 3) return data.trigger && log.triggerAvoided; if (W >= 4) return data.trigger && data.substitution && log.substitutionPracticed; return false;
        },
        checkDayCompletionStatus() { /* ... (no change) ... */ },
        handleCompleteDay() { /* ... (no change) ... */ },
        isWeekComplete() { /* ... (no change) ... */ },
        handleWeekCompletion() { /* ... (no change) ... */ },
        addPoints(amount, reason) { /* ... (no change) ... */ },
        handleGetMotivation() { /* ... (no change) ... */ },
        handleLlmChatSend() { /* ... (no change) ... */ },
        showModal(modalId) { /* ... (no change) ... */ },
        closeModal(modalId) { /* ... (no change) ... */ },
        showEducationModal(title, text) { /* ... (no change) ... */ },
        checkForMissedDays() { /* ... (no change) ... */ },

    }; // End App Object

    App.init();
});