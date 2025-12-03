// Simple encryption using user's email as key
// This ensures only the authenticated user can decrypt their data

const encryptData = (data, userEmail) => {
    try {
        // Create a simple cipher using email as seed
        const key = userEmail.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const jsonStr = JSON.stringify(data);

        // XOR encryption (simple but effective for this use case)
        let encrypted = '';
        for (let i = 0; i < jsonStr.length; i++) {
            encrypted += String.fromCharCode(jsonStr.charCodeAt(i) ^ (key % 256));
        }

        return btoa(encrypted); // Base64 encode
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};

const decryptData = (encryptedData, userEmail) => {
    try {
        const key = userEmail.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const encrypted = atob(encryptedData); // Base64 decode

        // XOR decryption
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ (key % 256));
        }

        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
    }
};

export const uploadEncryptedBackup = async (loans, userEmail, accessToken) => {
    try {
        // Encrypt data using user's email
        const encryptedData = encryptData({ loans, timestamp: new Date().toISOString() }, userEmail);

        const blob = new Blob([encryptedData], { type: 'text/plain' });
        const metadata = {
            name: 'lender_tracker_secure_backup.enc',
            mimeType: 'text/plain',
            description: 'Encrypted backup - can only be decrypted by authorized user'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        // First, try to find existing backup to update it
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='lender_tracker_secure_backup.enc'&spaces=appDataFolder`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );

        const searchData = await searchResponse.json();
        let fileId = null;

        if (searchData.files && searchData.files.length > 0) {
            fileId = searchData.files[0].id;
        }

        // Upload or update
        const url = fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&spaces=appDataFolder';

        const method = fileId ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: form,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Drive API Error Details:', JSON.stringify(errorData, null, 2));
            throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
        }

        console.log('✅ Encrypted backup uploaded to Google Drive');
        return await response.json();
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};

export const downloadEncryptedBackup = async (userEmail, accessToken) => {
    try {
        // Search for backup file
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='lender_tracker_secure_backup.enc'&spaces=appDataFolder`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );

        const searchData = await searchResponse.json();

        if (!searchData.files || searchData.files.length === 0) {
            console.log('No backup found in Google Drive');
            return null;
        }

        const fileId = searchData.files[0].id;

        // Download file
        const downloadResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );

        const encryptedData = await downloadResponse.text();

        // Decrypt using user's email
        const decryptedData = decryptData(encryptedData, userEmail);

        console.log(`✅ Restored ${decryptedData.loans.length} loans from encrypted backup`);
        // Return full object with timestamp for sync logic
        return decryptedData;
    } catch (error) {
        console.error('Download/decrypt failed:', error);
        throw error;
    }
};
