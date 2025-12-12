const STORAGE_KEY = 'lender_tracker_data';
const INVOICE_KEY = 'lender_tracker_invoices';
const SESSION_KEY = 'lender_tracker_session';

// Debug helper
const debugLog = (action, data) => {
    console.log(`[Storage ${action}]`, {
        timestamp: new Date().toISOString(),
        data: data,
        storageAvailable: typeof (Storage) !== "undefined"
    });
};

export const loadLoans = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const loans = data ? JSON.parse(data) : [];
        debugLog('LOAD', `Found ${loans.length} loans`);
        return loans;
    } catch (error) {
        console.error("Failed to load loans:", error);
        debugLog('LOAD ERROR', error.message);
        return [];
    }
};

export const saveLoans = (loans) => {
    try {
        const jsonData = JSON.stringify(loans);
        localStorage.setItem(STORAGE_KEY, jsonData);
        debugLog('SAVE', `Saved ${loans.length} loans (${jsonData.length} bytes)`);

        // Verify save
        const verification = localStorage.getItem(STORAGE_KEY);
        if (!verification) {
            console.error('CRITICAL: Save verification failed!');
        }
    } catch (error) {
        console.error("Failed to save loans:", error);
        debugLog('SAVE ERROR', error.message);
    }
};

// Track uploaded invoices
export const loadInvoices = () => {
    try {
        const data = localStorage.getItem(INVOICE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

export const saveInvoiceRecord = (invoiceId, driveLink) => {
    try {
        const current = loadInvoices();
        const updated = { ...current, [invoiceId]: driveLink };
        localStorage.setItem(INVOICE_KEY, JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.error("Failed to save invoice record:", error);
        return {};
    }
};

// Session persistence
export const saveSession = (user, accessToken) => {
    try {
        const session = {
            user,
            accessToken,
            timestamp: Date.now()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        debugLog('SESSION SAVE', 'Session saved');
    } catch (error) {
        console.error("Failed to save session:", error);
    }
};

export const loadSession = () => {
    try {
        const data = localStorage.getItem(SESSION_KEY);
        if (!data) {
            debugLog('SESSION LOAD', 'No session found');
            return null;
        }

        const session = JSON.parse(data);

        // Check if session is less than 7 days old
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - session.timestamp > sevenDays) {
            debugLog('SESSION LOAD', 'Session expired');
            clearSession();
            return null;
        }

        debugLog('SESSION LOAD', 'Session restored');
        return session;
    } catch (error) {
        console.error("Failed to load session:", error);
        return null;
    }
};

export const clearSession = () => {
    try {
        localStorage.removeItem(SESSION_KEY);
        debugLog('SESSION CLEAR', 'Session cleared');
    } catch (error) {
        console.error("Failed to clear session:", error);
    }
};

// LOCAL FILE BACKUP/RESTORE (No cloud needed!)
export const downloadBackupFile = (loans) => {
    try {
        const backup = {
            loans,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lender_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        debugLog('FILE BACKUP', 'Backup file downloaded');
        return true;
    } catch (error) {
        console.error('File backup failed:', error);
        return false;
    }
};

export const uploadBackupFile = () => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    debugLog('FILE RESTORE', `Restored ${backup.loans.length} loans from ${backup.timestamp}`);
                    resolve(backup.loans);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        };

        input.click();
    });
};

// BORROWER PROFILES
const PROFILES_KEY = 'lender_tracker_borrower_profiles';

export const loadBorrowerProfiles = () => {
    try {
        const data = localStorage.getItem(PROFILES_KEY);
        const profiles = data ? JSON.parse(data) : [];
        debugLog('PROFILES LOAD', `Found ${profiles.length} profiles`);
        return profiles;
    } catch (error) {
        console.error("Failed to load borrower profiles:", error);
        return [];
    }
};

export const saveBorrowerProfiles = (profiles) => {
    try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        debugLog('PROFILES SAVE', `Saved ${profiles.length} profiles`);
    } catch (error) {
        console.error("Failed to save borrower profiles:", error);
    }
};

export const getBorrowerProfile = (borrowerName) => {
    const profiles = loadBorrowerProfiles();
    return profiles.find(p => p.name === borrowerName);
};

export const saveBorrowerProfile = (profile) => {
    const profiles = loadBorrowerProfiles();
    const index = profiles.findIndex(p => p.name === profile.name);

    if (index >= 0) {
        profiles[index] = profile;
    } else {
        profiles.push(profile);
    }

    saveBorrowerProfiles(profiles);
    return profile;
};

export const deleteBorrowerProfile = (borrowerName) => {
    const profiles = loadBorrowerProfiles();
    const filtered = profiles.filter(p => p.name !== borrowerName);
    saveBorrowerProfiles(filtered);
};
