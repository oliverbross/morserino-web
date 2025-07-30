document.addEventListener('DOMContentLoaded', () => {
    const changePasswordButton = document.getElementById('changePasswordButton');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const usernameInput = document.getElementById('accountUsername');
    const apiBaseUrl = '/morserino/api';

    // Check session
    async function checkSession() {
        try {
            const response = await fetch(`${apiBaseUrl}/session.php`, { method: 'GET', credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (data.username) {
                    usernameInput.value = data.username;
                } else {
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
            window.location.href = 'index.html';
        }
    }
    checkSession();

    changePasswordButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const oldPassword = oldPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        if (!username || !oldPassword || !newPassword) {
            alert('Please fill in all fields.');
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/change-password.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, oldPassword, newPassword }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                alert('Password changed successfully.');
                oldPasswordInput.value = '';
                newPasswordInput.value = '';
            } else {
                alert(data.message || 'Failed to change password.');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password.');
        }
    });

    deleteAccountButton.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
        const username = usernameInput.value.trim();
        try {
            const response = await fetch(`${apiBaseUrl}/delete-account.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                alert('Account deleted successfully.');
                window.location.href = 'index.html';
            } else {
                alert(data.message || 'Failed to delete account.');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account.');
        }
    });
});