document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting minimal version');

    // Basic DOM elements - only essential ones
    const debug = document.getElementById('debug');
    const loggedIn = document.getElementById('loggedIn');
    const notLoggedIn = document.getElementById('notLoggedIn');
    const currentUsername = document.getElementById('currentUsername');
    const logoutButton = document.getElementById('logoutButton');
    const accountButton = document.getElementById('accountButton');
    const showLoginButton = document.getElementById('showLoginButton');
    const showRegisterButton = document.getElementById('showRegisterButton');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');
    const registerUsername = document.getElementById('registerUsername');
    const registerPassword = document.getElementById('registerPassword');
    const registerEmail = document.getElementById('registerEmail');
    const registerButton = document.getElementById('registerButton');
    const realWordsButton = document.getElementById('realWordsButton');
    const abbreviationsButton = document.getElementById('abbreviationsButton');
    const callsignsButton = document.getElementById('callsignsButton');
    const qrCodesButton = document.getElementById('qrCodesButton');
    const topWordsButton = document.getElementById('topWordsButton');
    const mixedButton = document.getElementById('mixedButton');
    const numItems = document.getElementById('numItems');
    const connectButton = document.getElementById('connectButton');
    const connectionStatus = document.getElementById('connectionStatus');
    const startButton = document.getElementById('startButton');
    const target = document.getElementById('target');
    const userInput = document.getElementById('userInput');
    const nextButton = document.getElementById('nextButton');
    const sessionStats = document.getElementById('sessionStats');
    const statsList = document.getElementById('statsList');
    const backToTraining = document.getElementById('backToTraining');

    // Test basic functionality first
    console.log('Debug element:', debug);
    console.log('Login button:', loginButton);
    console.log('Start button:', startButton);

    if (!debug) {
        alert('Critical error: Debug element not found. Page may not load correctly.');
        return;
    }

    // Simple section toggle function
    function toggleSection(id) {
        console.log('Toggling section:', id);
        const content = document.getElementById(`${id}-content`);
        const icon = document.querySelector(`[data-id="${id}-icon"]`);
        
        if (content && icon) {
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
                console.log(`Opened ${id}`);
            } else {
                content.classList.add('hidden');
                icon.classList.remove('rotate-180');
                console.log(`Closed ${id}`);
            }
        } else {
            console.error(`Toggle failed: content=${!!content}, icon=${!!icon}`);
        }
    }

    // Add click listeners to section headers
    console.log('Adding section header listeners...');
    document.querySelectorAll('.section-header').forEach((header, index) => {
        console.log(`Found section header ${index}:`, header);
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = header.closest('.section');
            if (section && section.dataset.id) {
                console.log('Clicking section:', section.dataset.id);
                toggleSection(section.dataset.id);
            } else {
                console.error('Section or dataset.id not found:', section);
            }
        });
    });

    // Initialize Sortable.js
    let sortableInstance = null;
    function initSortable() {
        const sortableSections = document.getElementById('sortable-sections');
        if (sortableSections && typeof Sortable !== 'undefined') {
            sortableInstance = new Sortable(sortableSections, {
                animation: 150,
                handle: '.section',
                onStart: () => console.log('Sorting started'),
                onEnd: () => console.log('Sorting ended')
            });
            console.log('Sortable initialized');
        } else {
            console.log('Sortable not available or element not found');
        }
    }

    // Test section expansion
    console.log('Testing section expansion...');
    setTimeout(() => {
        toggleSection('login-register');
        console.log('Test toggle completed');
    }, 1000);

    // Initialize sortable
    initSortable();

    // Basic API configuration
    const apiBaseUrl = 'https://om0rx.com/morserino/api';

    // Basic session variables
    let currentMode = 'realWords';
    let sessionActive = false;
    let port = null;
    let reader = null;
    let maxItems = 10;
    let sessionData = { correct: 0, total: 0 };

    console.log('Basic initialization complete');

    // Add basic button functionality for testing
    if (showLoginButton) {
        showLoginButton.addEventListener('click', () => {
            console.log('Show login clicked');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            showLoginButton.classList.add('bg-blue-600');
            showRegisterButton.classList.remove('bg-blue-600');
        });
    }

    if (showRegisterButton) {
        showRegisterButton.addEventListener('click', () => {
            console.log('Show register clicked');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            showRegisterButton.classList.add('bg-blue-600');
            showLoginButton.classList.remove('bg-blue-600');
        });
    }

    // Mode selection buttons
    [realWordsButton, abbreviationsButton, callsignsButton, qrCodesButton, topWordsButton, mixedButton].forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                [realWordsButton, abbreviationsButton, callsignsButton, qrCodesButton, topWordsButton, mixedButton].forEach(btn => {
                    if (btn) btn.classList.remove('bg-blue-600');
                    if (btn) btn.classList.add('bg-blue-500');
                });
                // Add active class to clicked button
                button.classList.remove('bg-blue-500');
                button.classList.add('bg-blue-600');
                currentMode = button.id.replace('Button', '');
                console.log('Mode selected:', currentMode);
            });
        }
    });

    console.log('Event listeners added');
});