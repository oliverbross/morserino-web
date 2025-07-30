document.addEventListener('DOMContentLoaded', () => {
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
    const accountStats = document.getElementById('accountStats');
    const exportStatsButton = document.getElementById('exportStatsButton');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const accountLogoutButton = document.getElementById('accountLogoutButton');
    const backToTrainingFromAccount = document.getElementById('backToTrainingFromAccount');

    // Verify DOM elements exist
    if (!currentUsername || !accountDebug || !saveSettingsButton) {
        console.error('Critical DOM elements missing:', { currentUsername, accountDebug, saveSettingsButton });
        document.body.innerHTML = '<p>Error: Page failed to load correctly. Please try again.</p>';
        return;
    }

    async function checkSession() {
        try {
            const response = await fetch(`${apiBaseUrl}/session.php`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Session response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse session response:', e.message, 'Response:', text);
                throw new Error('Invalid session response format');
            }
            if (response.ok && data.username) {
                console.log('User logged in:', data.username);
                currentUsername.textContent = data.username;
                sessionStorage.setItem('username', data.username);
                fetchStats(data.username);
                fetchUserSettings(data.username);
            } else {
                console.error('Session check failed:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Error: ${data.message || 'Session not found'}`;
                accountDebug.classList.remove('hidden');
                setTimeout(() => {
                    window.location.href = '/morserino/index.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Session check error:', error.message, 'Response:', text || 'No response');
            accountDebug.textContent = `Failed to load account: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
            setTimeout(() => {
                window.location.href = '/morserino/index.html';
            }, 2000);
        }
    }
    checkSession();

    async function fetchUserSettings(username) {
        try {
            const response = await fetch(`${apiBaseUrl}/settings.php?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Settings response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse settings response:', e.message, 'Response:', text);
                accountDebug.textContent = `Failed to fetch settings: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok && data) {
                recoveryEmail.value = data.email || '';
                dateFormatSelect.value = data.dateFormat || 'DD/MM/YYYY';
                timeFormatSelect.value = data.timeFormat || '12h';
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to fetch settings:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Failed to fetch settings: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Settings fetch error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Failed to fetch settings: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    }

    async function fetchStats(username) {
        try {
            const response = await fetch(`${apiBaseUrl}/stats.php?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Stats response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse stats response:', e.message, 'Response:', text);
                accountDebug.textContent = `Failed to fetch stats: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok) {
                if (data.sessions && data.sessions.length > 0) {
                    const totalSessions = data.sessions.length;
                    const totalCorrect = data.sessions.reduce((sum, s) => sum + s.correct, 0);
                    const totalItems = data.sessions.reduce((sum, s) => sum + s.total, 0);
                    accountStats.textContent = `Total Sessions: ${totalSessions}, Correct: ${totalCorrect}/${totalItems} (${((totalCorrect/totalItems)*100).toFixed(2)}%)`;
                } else {
                    accountStats.textContent = 'No sessions recorded yet.';
                }
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to fetch stats:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Failed to fetch stats: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Stats fetch error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Failed to fetch stats: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    }

    changePasswordButton.addEventListener('click', async () => {
        const password = newPassword.value.trim();
        const confirm = confirmPassword.value.trim();
        if (!password || !confirm) {
            accountDebug.textContent = 'Please enter and confirm new password.';
            accountDebug.classList.remove('hidden');
            return;
        }
        if (password !== confirm) {
            accountDebug.textContent = 'Passwords do not match.';
            accountDebug.classList.remove('hidden');
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/change_password.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: sessionStorage.getItem('username'), password }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Change password response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse password change response:', e.message, 'Response:', text);
                accountDebug.textContent = `Password change failed: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok && data.message === 'Password changed successfully') {
                alert('Password changed successfully!');
                newPassword.value = '';
                confirmPassword.value = '';
                accountDebug.classList.add('hidden');
            } else {
                console.error('Password change failed:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Password change failed: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Password change error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Password change failed: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    });

    saveEmailButton.addEventListener('click', async () => {
        const email = recoveryEmail.value.trim();
        if (!email) {
            accountDebug.textContent = 'Please enter a recovery email.';
            accountDebug.classList.remove('hidden');
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: sessionStorage.getItem('username'),
                    email,
                    dateFormat: dateFormatSelect.value,
                    timeFormat: timeFormatSelect.value
                }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Save email response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse save email response:', e.message, 'Response:', text);
                accountDebug.textContent = `Failed to save email: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok && data.message === 'Settings updated successfully') {
                alert('Email saved successfully!');
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to save email:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Failed to save email: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Save email error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Failed to save email: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    });

    saveSettingsButton.addEventListener('click', async () => {
        const dateFormat = dateFormatSelect.value;
        const timeFormat = timeFormatSelect.value;
        try {
            const response = await fetch(`${apiBaseUrl}/settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: sessionStorage.getItem('username'),
                    email: recoveryEmail.value.trim(),
                    dateFormat,
                    timeFormat
                }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Save settings response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse save settings response:', e.message, 'Response:', text);
                accountDebug.textContent = `Failed to save settings: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok && data.message === 'Settings updated successfully') {
                alert('Settings saved successfully!');
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to save settings:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Failed to save settings: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Save settings error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Failed to save settings: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    });

    exportStatsButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/stats.php?username=${encodeURIComponent(sessionStorage.getItem('username'))}`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Export stats response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse export stats response:', e.message, 'Response:', text);
                accountDebug.textContent = `Failed to export stats: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok && data.sessions) {
                const csv = ['Session,Correct,Total,Mode,Date'];
                data.sessions.forEach((s, i) => {
                    csv.push(`${i+1},${s.correct},${s.total},${s.mode},${s.date}`);
                });
                const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'morserino_stats.csv';
                a.click();
                URL.revokeObjectURL(url);
                accountDebug.classList.add('hidden');
            } else {
                console.error('Failed to export stats:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Failed to export stats: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Export stats error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Failed to export stats: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    });

    deleteAccountButton.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/delete_account.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: sessionStorage.getItem('username') }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Delete account response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse delete account response:', e.message, 'Response:', text);
                accountDebug.textContent = `Delete account failed: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok && data.message === 'Account deleted successfully') {
                sessionStorage.removeItem('username');
                alert('Account deleted successfully.');
                window.location.href = '/morserino/index.html';
            } else {
                console.error('Delete account failed:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Delete account failed: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Delete account error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Delete account failed: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    });

    accountLogoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/logout.php`, {
                method: 'POST',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Logout response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse logout response:', e.message, 'Response:', text);
                accountDebug.textContent = `Logout failed: Invalid response - ${text.substring(0, 100)}...`;
                accountDebug.classList.remove('hidden');
                return;
            }
            if (response.ok && data.message === 'Logged out successfully') {
                sessionStorage.removeItem('username');
                alert('Logged out successfully!');
                window.location.href = '/morserino/index.html';
            } else {
                console.error('Logout failed:', data.message || 'Unknown error', 'Response:', text);
                accountDebug.textContent = `Logout failed: ${data.message || 'Unknown error'}`;
                accountDebug.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Logout error:', error.message, 'Response:', error.responseText || 'No response');
            accountDebug.textContent = `Logout failed: Network error - ${error.message}`;
            accountDebug.classList.remove('hidden');
        }
    });

    backToTrainingFromAccount.addEventListener('click', () => {
        window.location.href = '/morserino/index.html';
    });
});
