document.addEventListener('DOMContentLoaded', () => {
    console.log('Account.js loaded - Version 2.0 - Statistics Removed'); // Force cache refresh
    const apiBaseUrl = '/morserino/api';
    const currentUsername = document.getElementById('currentUsername');
    const accountDebug = document.getElementById('accountDebug');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordButton = document.getElementById('changePasswordButton');
    const recoveryEmail = document.getElementById('recoveryEmail');
    const saveEmailButton = document.getElementById('saveEmailButton');
    const dateFormatSelect = document.getElementById('dateFormatSelect');
    const timeFormatSelect = document.getElementById('timeFormatSelect');
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    // Statistics elements removed - now on dedicated statistics page
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const accountLogoutButton = document.getElementById('accountLogoutButton');
    const backToTrainingFromAccount = document.getElementById('backToTrainingFromAccount');
    const sortableSections = document.getElementById('sortable-sections');

    // Verify DOM elements
    const requiredElements = {
        currentUsername, accountDebug, newPassword, confirmPassword, changePasswordButton,
        recoveryEmail, saveEmailButton, dateFormatSelect, timeFormatSelect, saveSettingsButton,
        deleteAccountButton, accountLogoutButton, backToTrainingFromAccount, sortableSections
    };
    for (const [key, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`Missing DOM element: ${key}`);
            accountDebug.textContent = `Error: Missing critical element ${key}. Please check page structure.`;
            accountDebug.classList.remove('hidden');
            return;
        }
    }
    console.log('All required DOM elements found');

    // Reset CSS to ensure visibility
    const styleReset = document.createElement('style');
    styleReset.textContent = `
        #sortable-sections, .section, .section-header, [id$="-content"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            overflow: visible !important;
        }
        .hidden {
            display: none !important;
        }
    `;
    document.head.appendChild(styleReset);
    console.log('CSS reset applied');

    // User preferences for date/time formatting
    let userPreferences = {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
    };

    // Format timestamp according to user preferences
    function formatTimestamp(timestamp) {
        if (!timestamp) return 'No timestamp';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp; // Return original if invalid
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            let dateStr;
            if (userPreferences.dateFormat === 'MM/DD/YYYY') {
                dateStr = `${month}/${day}/${year}`;
            } else {
                dateStr = `${day}/${month}/${year}`;
            }
            
            let timeStr;
            console.log('Account.js formatTimestamp - userPreferences.timeFormat:', userPreferences.timeFormat, 'type:', typeof userPreferences.timeFormat);
            
            // Check the current select value as fallback
            const currentTimeFormat = timeFormatSelect ? timeFormatSelect.value : userPreferences.timeFormat;
            console.log('Account.js formatTimestamp - currentTimeFormat from select:', currentTimeFormat);
            
            // More robust comparison for 12-hour format
            const is12Hour = currentTimeFormat === '12h' || userPreferences.timeFormat === '12h' || 
                           currentTimeFormat === '12-hour' || userPreferences.timeFormat === '12-hour' || 
                           currentTimeFormat === '12H' || userPreferences.timeFormat === '12H';
                           
            if (is12Hour) {
                timeStr = date.toLocaleTimeString('en-US', { 
                    hour12: true, 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                console.log('Account.js formatTimestamp - Using 12h format:', timeStr);
            } else {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                timeStr = `${hours}:${minutes}:${seconds}`;
                console.log('Account.js formatTimestamp - Using 24h format:', timeStr);
            }
            
            return `${dateStr} ${timeStr}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return timestamp; // Return original if formatting fails
        }
    }

    // Show toast notification
    function showToast(message, bgClass) {
        const toast = document.createElement('div');
        toast.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg text-white text-lg font-semibold ${bgClass} opacity-0 transition-opacity duration-300 shadow-lg max-w-md text-center z-50`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('opacity-90'), 100);
        setTimeout(() => {
            toast.classList.remove('opacity-90');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show all sections
    function showAllSections() {
        console.log('Attempting to show all sections');
        const sections = document.querySelectorAll('#sortable-sections .section');
        if (sections.length === 0) {
            console.error('No sections found in sortable-sections');
            accountDebug.textContent = 'Error: No sections found on page. Check account.html structure.';
            accountDebug.classList.remove('hidden');
            return;
        }
        sections.forEach(section => {
            if (!section.dataset.id) {
                console.error('Section missing data-id:', section);
                return;
            }
            section.classList.remove('hidden');
            section.style.display = 'block';
            section.style.visibility = 'visible';
            const content = document.getElementById(`${section.dataset.id}-content`);
            const icon = document.querySelector(`[data-id="${section.dataset.id}-icon"]`);
            if (content && icon) {
                content.classList.remove('hidden');
                content.style.display = 'block';
                content.style.visibility = 'visible';
                // Removed rotate-180 to avoid layout interference
                console.log(`Section ${section.dataset.id} shown, header styles:`, window.getComputedStyle(section.querySelector('.section-header')));
            } else {
                console.error(`Failed to show section ${section.dataset.id}: content=${!!content}, icon=${!!icon}`);
                accountDebug.textContent = `Error: Missing content or icon for section ${section.dataset.id}`;
                accountDebug.classList.remove('hidden');
            }
        });
        sortableSections.classList.remove('hidden');
        sortableSections.style.display = 'block';
        sortableSections.style.visibility = 'visible';
        console.log('Sections visibility set:', Array.from(sections).map(s => `${s.dataset.id}: display=${s.style.display}, visibility=${s.style.visibility}, class=${s.className}`));
        sections.forEach(section => {
            const computedStyle = window.getComputedStyle(section);
            console.log(`Section ${section.dataset.id} computed styles: display=${computedStyle.display}, visibility=${computedStyle.visibility}, opacity=${computedStyle.opacity}`);
        });
    }

    // Toggle section visibility
    function toggleSection(id) {
        const content = document.getElementById(`${id}-content`);
        const icon = document.querySelector(`[data-id="${id}-icon"]`);
        if (content && icon) {
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                content.style.display = 'block';
                content.style.visibility = 'visible';
                icon.classList.remove('rotate-180');
            } else {
                content.classList.add('hidden');
                content.style.display = 'none';
                content.style.visibility = 'hidden';
                icon.classList.add('rotate-180');
            }
            console.log(`Toggled section ${id}: display=${content.style.display}, visibility=${content.style.visibility}`);
        } else {
            console.error(`Toggle section failed: content=${!!content}, icon=${!!icon} for id ${id}`);
            accountDebug.textContent = `Error: Toggle failed for section ${id}`;
            accountDebug.classList.remove('hidden');
        }
    }

    // Add click listeners to section headers
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = header.closest('.section');
            if (section && section.dataset.id) {
                toggleSection(section.dataset.id);
            } else {
                console.error('Section header click failed: section or dataset.id missing', section);
                accountDebug.textContent = 'Error: Invalid section header structure';
                accountDebug.classList.remove('hidden');
            }
        });
    });

    // Initialize Sortable.js
    if (sortableSections) {
        try {
            new Sortable(sortableSections, {
                animation: 150,
                handle: '.section',
                onEnd: async (evt) => {
                    const sectionOrder = Array.from(sortableSections.children).map(section => section.dataset.id);
                    console.log('Section order changed:', sectionOrder);
                    const username = sessionStorage.getItem('username');
                    if (!username) {
                        showToast('Session expired. Please log in again.', 'bg-red-600');
                        accountDebug.textContent = 'Error: No user logged in';
                        accountDebug.classList.remove('hidden');
                        setTimeout(() => window.location.href = '/morserino/index.html', 3000);
                        return;
                    }
                    try {
                        const response = await fetch(`${apiBaseUrl}/settings.php`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify({ username, section_order: sectionOrder }),
                            credentials: 'include'
                        });
                        const text = await response.text();
                        console.log('Save section order response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
                        let data;
                        try {
                            data = JSON.parse(text.trim());
                        } catch (e) {
                            console.error('Parse section order response error:', e.message, 'Response:', text);
                            showToast('Failed to save section order: Invalid server response', 'bg-red-600');
                            accountDebug.textContent = `Error: Invalid server response - ${e.message}`;
                            accountDebug.classList.remove('hidden');
                            return;
                        }
                        if (response.ok && data.message === 'Settings updated successfully') {
                            showToast('Section order saved successfully!', 'bg-green-600');
                            accountDebug.classList.add('hidden');
                        } else {
                            showToast(`Failed to save section order: ${data.message || 'Unknown error'}`, 'bg-red-600');
                            accountDebug.textContent = `Error: ${data.message || 'Unknown error'}`;
                            accountDebug.classList.remove('hidden');
                        }
                    } catch (error) {
                        console.error('Section order save error:', error.message);
                        showToast(`Failed to save section order: ${error.message}`, 'bg-red-600');
                        accountDebug.textContent = `Error: Network error - ${error.message}`;
                        accountDebug.classList.remove('hidden');
                    }
                    showAllSections();
                }
            });
        } catch (error) {
            console.error('Sortable.js initialization failed:', error.message);
            accountDebug.textContent = 'Error: Failed to initialize section reordering';
            accountDebug.classList.remove('hidden');
        }
    }

    async function checkSession() {
        console.log('Checking session, cookies sent:', document.cookie);
        try {
            const response = await fetch(`${apiBaseUrl}/session.php`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            const text = await response.text();
            console.log('Session response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse session response:', e.message, 'Response:', text);
                showToast('Failed to load account: Invalid session response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid session response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return false;
            }
            if (response.ok && data.username) {
                console.log('User logged in:', data.username);
                currentUsername.textContent = data.username;
                sessionStorage.setItem('username', data.username);
                showAllSections();
                // Load user settings only (statistics moved to dedicated page)
                await fetchUserSettings(data.username).catch(err => {
                    console.error('fetchUserSettings failed:', err.message);
                    accountDebug.textContent = `Settings error: ${err.message}`;
                    accountDebug.classList.remove('hidden');
                    showAllSections();
                });
                return true;
            } else {
                console.error('Session check failed:', data.message || 'Unknown error', 'Response:', text);
                showToast(`Session check failed: ${data.message || 'Not logged in'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'Session not found'}`;
                accountDebug.classList.remove('hidden');
                sessionStorage.removeItem('username');
                setTimeout(() => window.location.href = '/morserino/index.html', 3000);
                return false;
            }
        } catch (error) {
            console.error('Session check error:', error.message);
            showToast(`Failed to load account: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
            return false;
        }
    }

    async function fetchUserSettings(username) {
        console.log('Fetching settings for:', username, 'Cookies:', document.cookie);
        try {
            const response = await fetch(`${apiBaseUrl}/settings.php?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            const text = await response.text();
            console.log('Settings response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse settings response:', e.message, 'Response:', text);
                showToast('Failed to fetch settings: Invalid server response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid settings response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return;
            }
            if (response.ok && data) {
                recoveryEmail.value = data.email || '';
                userPreferences.dateFormat = data.date_format || data.dateFormat || 'DD/MM/YYYY';
                userPreferences.timeFormat = data.time_format || data.timeFormat || '12h';
                dateFormatSelect.value = userPreferences.dateFormat;
                timeFormatSelect.value = userPreferences.timeFormat;
                dateFormatSelect.dispatchEvent(new Event('change'));
                timeFormatSelect.dispatchEvent(new Event('change'));
                console.log('Settings loaded:', {
                    email: recoveryEmail.value,
                    dateFormat: userPreferences.dateFormat,
                    timeFormat: userPreferences.timeFormat,
                    rawData: { date_format: data.date_format, time_format: data.time_format, dateFormat: data.dateFormat, timeFormat: data.timeFormat }
                });
                if (data.section_order && Array.isArray(data.section_order)) {
                    const sections = document.querySelectorAll('#sortable-sections .section');
                    const sectionOrder = data.section_order;
                    try {
                        sections.forEach(section => sortableSections.removeChild(section));
                        sectionOrder.forEach(id => {
                            const section = Array.from(sections).find(s => s.dataset.id === id);
                            if (section) sortableSections.appendChild(section);
                        });
                        showAllSections();
                    } catch (e) {
                        console.error('Section reordering failed:', e.message);
                        accountDebug.textContent = `Error: Section reordering failed - ${e.message}`;
                        accountDebug.classList.remove('hidden');
                    }
                }
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to fetch settings:', data.message || 'Unknown error', 'Response:', text);
                showToast(`Failed to fetch settings: ${data.message || 'Unknown error'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'No settings returned'}`;
                accountDebug.classList.remove('hidden');
            }
            showAllSections();
        } catch (error) {
            console.error('Settings fetch error:', error.message);
            showToast(`Failed to fetch settings: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
        }
    }

    // Statistics functionality moved to dedicated statistics.html page

    changePasswordButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const password = newPassword.value.trim();
        const confirm = confirmPassword.value.trim();
        if (!password || !confirm) {
            showToast('Please enter and confirm new password.', 'bg-red-600');
            accountDebug.textContent = 'Error: Password fields are empty';
            accountDebug.classList.remove('hidden');
            showAllSections();
            return;
        }
        if (password !== confirm) {
            showToast('Passwords do not match.', 'bg-red-600');
            accountDebug.textContent = 'Error: Passwords do not match';
            accountDebug.classList.remove('hidden');
            showAllSections();
            return;
        }
        const username = sessionStorage.getItem('username');
        if (!username) {
            showToast('Session expired. Please log in again.', 'bg-red-600');
            accountDebug.textContent = 'Error: No user logged in';
            accountDebug.classList.remove('hidden');
            setTimeout(() => window.location.href = '/morserino/index.html', 3000);
            return;
        }
        try {
            console.log('Sending change password request for:', username, 'Cookies:', document.cookie);
            const response = await fetch(`${apiBaseUrl}/change_password.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Change password response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse password change response:', e.message, 'Response:', text);
                showToast('Password change failed: Invalid server response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid server response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return;
            }
            if (response.ok && data.message === 'Password changed successfully') {
                showToast('Password changed successfully! Please log in again.', 'bg-green-600');
                newPassword.value = '';
                confirmPassword.value = '';
                sessionStorage.removeItem('username');
                setTimeout(() => window.location.href = '/morserino/index.html', 3000);
            } else {
                console.error('Password change failed:', data.message || 'Unknown error', 'Response:', text);
                showToast(`Password change failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
            }
        } catch (error) {
            console.error('Password change error:', error.message);
            showToast(`Password change failed: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${e.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
        }
    });

    saveEmailButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = recoveryEmail.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address.', 'bg-red-600');
            accountDebug.textContent = 'Error: Invalid email address';
            accountDebug.classList.remove('hidden');
            showAllSections();
            return;
        }
        const username = sessionStorage.getItem('username');
        if (!username) {
            showToast('Session expired. Please log in again.', 'bg-red-600');
            accountDebug.textContent = 'Error: No user logged in';
            accountDebug.classList.remove('hidden');
            setTimeout(() => window.location.href = '/morserino/index.html', 3000);
            return;
        }
        try {
            console.log('Sending save email request for:', username, 'Cookies:', document.cookie);
            const response = await fetch(`${apiBaseUrl}/settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username, email }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Save email response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse save email response:', e.message, 'Response:', text);
                showToast('Failed to save email: Invalid server response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid server response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return;
            }
            if (response.ok && data.message === 'Settings updated successfully') {
                showToast('Email saved successfully!', 'bg-green-600');
                fetchUserSettings(username);
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to save email:', data.message || 'Unknown error', 'Response:', text);
                showToast(`Failed to save email: ${data.message || 'Unknown error'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
            }
        } catch (error) {
            console.error('Save email error:', error.message);
            showToast(`Failed to save email: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
        }
    });

    saveSettingsButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const dateFormat = dateFormatSelect.value;
        const timeFormat = timeFormatSelect.value;
        if (!dateFormat || !timeFormat) {
            showToast('Please select date and time formats.', 'bg-red-600');
            accountDebug.textContent = 'Error: Date or time format not selected';
            accountDebug.classList.remove('hidden');
            showAllSections();
            return;
        }
        const username = sessionStorage.getItem('username');
        if (!username) {
            showToast('Session expired. Please log in again.', 'bg-red-600');
            accountDebug.textContent = 'Error: No user logged in';
            accountDebug.classList.remove('hidden');
            setTimeout(() => window.location.href = '/morserino/index.html', 3000);
            return;
        }
        try {
            console.log('Sending save settings request for:', username, 'Body:', { username, dateFormat, timeFormat, date_format: dateFormat, time_format: timeFormat });
            const response = await fetch(`${apiBaseUrl}/settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username, dateFormat, timeFormat, date_format: dateFormat, time_format: timeFormat }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Save settings response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse save settings response:', e.message, 'Response:', text);
                showToast('Failed to save settings: Invalid server response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid server response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return;
            }
            if (response.ok && data.message === 'Settings updated successfully') {
                userPreferences.dateFormat = dateFormat;
                userPreferences.timeFormat = timeFormat;
                showToast('Settings saved successfully!', 'bg-green-600');
                fetchUserSettings(username);
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to save settings:', data.message || 'Unknown error', 'Response:', text);
                showToast(`Failed to save settings: ${data.message || 'Unknown error'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
            }
        } catch (error) {
            console.error('Save settings error:', error.message);
            showToast(`Failed to save settings: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
        }
    });

    exportStatsButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = sessionStorage.getItem('username');
        if (!username) {
            showToast('Session expired. Please log in again.', 'bg-red-600');
            accountDebug.textContent = 'Error: No user logged in';
            accountDebug.classList.remove('hidden');
            setTimeout(() => window.location.href = '/morserino/index.html', 3000);
            return;
        }
        try {
            console.log('Sending export stats request for:', username, 'Cookies:', document.cookie);
            const response = await fetch(`${apiBaseUrl}/get_stats.php?username=${encodeURIComponent(username)}&limit=100`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            const text = await response.text();
            console.log('Export stats response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse export stats response:', e.message, 'Response:', text);
                showToast('Failed to export stats: Invalid server response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid server response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return;
            }
            if (response.ok && Array.isArray(data)) {
                if (data.length === 0) {
                    showToast('No stats available to export', 'bg-yellow-600');
                    accountDebug.textContent = 'No stats found for this user';
                    accountDebug.classList.remove('hidden');
                    showAllSections();
                    return;
                }
                const csv = ['Session,Correct,Total,Mode,Timestamp'];
                data.forEach((s, i) => {
                    csv.push(`${i+1},${s.correct || 0},${s.total || 0},${s.mode || ''},${s.timestamp || ''}`);
                });
                const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `morserino_stats_${username}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Statistics exported successfully!', 'bg-green-600');
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to export stats:', data.message || 'No stats returned', 'Response:', text);
                showToast(`Failed to export stats: ${data.message || 'Unknown error'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'No stats returned'}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
            }
        } catch (error) {
            console.error('Export stats error:', error.message);
            showToast(`Failed to export stats: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
        }
    });

    deleteAccountButton.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            return;
        }
        const username = sessionStorage.getItem('username');
        if (!username) {
            showToast('Session expired. Please log in again.', 'bg-red-600');
            accountDebug.textContent = 'Error: No user logged in';
            accountDebug.classList.remove('hidden');
            setTimeout(() => window.location.href = '/morserino/index.html', 3000);
            return;
        }
        try {
            console.log('Sending delete account request for:', username, 'Cookies:', document.cookie);
            const response = await fetch(`${apiBaseUrl}/delete_account.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Delete account response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse delete account response:', e.message, 'Response:', text);
                showToast('Delete account failed: Invalid server response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid server response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return;
            }
            if (response.ok && data.message === 'Account deleted successfully') {
                sessionStorage.removeItem('username');
                showToast('Account deleted successfully.', 'bg-green-600');
                setTimeout(() => window.location.href = '/morserino/index.html', 1000);
            } else {
                console.error('Delete account failed:', data.message || 'Unknown error', 'Response:', text);
                showToast(`Delete account failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
            }
        } catch (error) {
            console.error('Delete account error:', error.message);
            showToast(`Delete account failed: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
        }
    });

    accountLogoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            console.log('Sending logout request, Cookies:', document.cookie);
            const response = await fetch(`${apiBaseUrl}/logout.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Logout response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text.trim());
            } catch (e) {
                console.error('Failed to parse logout response:', e.message, 'Response:', text);
                showToast('Logout failed: Invalid server response', 'bg-red-600');
                accountDebug.textContent = `Error: Invalid server response - ${e.message}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
                return;
            }
            if (response.ok && data.message === 'Logged out successfully') {
                sessionStorage.removeItem('username');
                showToast('Logged out successfully!', 'bg-green-600');
                setTimeout(() => window.location.href = '/morserino/index.html', 1000);
            } else {
                console.error('Logout failed:', data.message || 'Unknown error', 'Response:', text);
                showToast(`Logout failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
                accountDebug.textContent = `Error: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
                showAllSections();
            }
        } catch (error) {
            console.error('Logout error:', error.message);
            showToast(`Logout failed: ${error.message}`, 'bg-red-600');
            accountDebug.textContent = `Error: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            showAllSections();
        }
    });

    backToTrainingFromAccount.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Back to Training button clicked - navigating to index.html');  
        window.location.href = '/morserino/index.html';
    });

    // Initialize session check
    showAllSections();
    checkSession();
});
