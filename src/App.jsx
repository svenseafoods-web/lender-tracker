import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import EntryForm from './components/EntryForm';
import LoanList from './components/LoanList';
import SummaryCards from './components/SummaryCards';
import EditModal from './components/EditModal';
import Login from './components/Login';
import SingleLoanView from './components/SingleLoanView';
import BorrowerDashboard from './components/BorrowerDashboard';
import BorrowerProfileModal from './components/BorrowerProfileModal';
import { loadLoans, saveLoans, loadSession, saveSession, clearSession, downloadBackupFile, uploadBackupFile, loadBorrowerProfiles, saveBorrowerProfile, deleteBorrowerProfile } from './utils/storage';
import { uploadEncryptedBackup, downloadEncryptedBackup } from './utils/driveApi';
import { ALLOWED_EMAILS } from './config';
import { LogOut, Download, Upload, Cloud, CloudOff, CloudUpload } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loans, setLoans] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [tick, setTick] = useState(0);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [selectedBorrower, setSelectedBorrower] = useState('');
  const [borrowerProfiles, setBorrowerProfiles] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  // Load initial data and restore session
  useEffect(() => {
    const loaded = loadLoans();
    setLoans(loaded);

    // Load borrower profiles
    const profiles = loadBorrowerProfiles();
    setBorrowerProfiles(profiles);

    // Restore session if available
    const session = loadSession();
    if (session) {
      setUser(session.user);
      setAccessToken(session.accessToken);
      // Trigger immediate sync on load
      syncWithCloud(session.user.email, session.accessToken);
    }
  }, []);

  // Save data whenever loans change
  useEffect(() => {
    if (loans.length > 0) {
      const timestamp = new Date().toISOString();
      saveLoans(loans);
      localStorage.setItem('lender_tracker_last_updated', timestamp);
      console.log(`💾 Saved ${loans.length} loans to localStorage at ${timestamp}`);
    }
  }, [loans]);

  // Reusable sync function
  const syncWithCloud = async (userEmail, token) => {
    try {
      setCloudSyncStatus('syncing');
      const cloudData = await downloadEncryptedBackup(userEmail, token);

      if (cloudData && cloudData.loans && cloudData.loans.length > 0) {
        const localLoans = loadLoans();
        const localTimestamp = localStorage.getItem('lender_tracker_last_updated');
        const cloudTimestamp = cloudData.timestamp;

        console.log('Sync Check:', {
          localCount: localLoans.length,
          localTime: localTimestamp,
          cloudCount: cloudData.loans.length,
          cloudTime: cloudTimestamp
        });

        // Improved Logic to prevent data loss:
        // 1. If no local data, take cloud
        // 2. If cloud timestamp is newer AND has more or equal loans, take cloud
        // 3. If local has more loans than cloud (even if timestamp is older), keep local and warn user
        // 4. If timestamps are close (within 1 minute) and local has more data, keep local

        let shouldRestore = false;
        let reason = '';

        if (localLoans.length === 0) {
          shouldRestore = true;
          reason = 'no_local_data';
        } else if (!localTimestamp) {
          // No local timestamp, but we have data - this is suspicious, keep local
          shouldRestore = false;
          reason = 'no_local_timestamp';
          console.log('⚠️ Local data exists but no timestamp. Keeping local data to be safe.');
        } else if (cloudTimestamp && new Date(cloudTimestamp) > new Date(localTimestamp)) {
          // Cloud is newer
          if (cloudData.loans.length >= localLoans.length) {
            // Cloud has more or equal data, safe to restore
            shouldRestore = true;
            reason = 'cloud_newer_and_more_data';
          } else {
            // Cloud is newer but has LESS data - this is the bug scenario!
            // Keep local data and warn user
            shouldRestore = false;
            reason = 'cloud_newer_but_less_data';
            console.warn('⚠️ Cloud data is newer but has fewer loans. Keeping local data to prevent loss.');
            alert(`⚠️ Warning: Cloud backup is older (has ${cloudData.loans.length} loans vs your local ${localLoans.length} loans). Keeping your local data. Click "Backup to Cloud" to update the cloud.`);
          }
        } else {
          shouldRestore = false;
          reason = 'local_newer';
        }

        console.log(`Sync decision: ${shouldRestore ? 'RESTORE from cloud' : 'KEEP local'} (reason: ${reason})`);

        if (shouldRestore) {
          setLoans(cloudData.loans);
          // Update local timestamp to match cloud so we don't re-sync unnecessarily
          localStorage.setItem('lender_tracker_last_updated', cloudTimestamp || new Date().toISOString());

          if (reason === 'no_local_data') {
            alert(`✅ Restored ${cloudData.loans.length} loans from cloud!`);
          } else {
            alert(`✅ Synced with cloud: Found newer data from ${new Date(cloudTimestamp).toLocaleTimeString()}`);
          }
        } else {
          console.log(`Local data preserved (${localLoans.length} loans).`);
        }
      }
      setCloudSyncStatus('success');
    } catch (error) {
      console.error('Sync failed:', error);

      // Check if it's a 401 error (token expired)
      if (error.message && (error.message.includes('401') || error.message.includes('Invalid Credentials'))) {
        console.log('Token expired during sync, logging out...');
        setUser(null);
        setAccessToken(null);
        clearSession();
        alert('⚠️ Your session has expired. Please log in again.');
        return;
      }

      setCloudSyncStatus('error');
      // Don't alert on auto-sync error to avoid annoyance, just show status icon
    }
  };

  // Auto-backup to cloud every 5 minutes (Encrypted)
  useEffect(() => {
    if (!accessToken || !user || loans.length === 0) return;

    const autoBackup = async () => {
      // SAFETY CHECK: Never auto-backup an empty list.
      // This prevents overwriting cloud data when logging in from a new device.
      if (loans.length === 0) {
        console.log('Skipping auto-backup: No local loans to save.');
        return;
      }

      try {
        setCloudSyncStatus('syncing');
        await uploadEncryptedBackup(loans, user.email, accessToken);
        setCloudSyncStatus('success');
        // Update local timestamp after successful upload
        localStorage.setItem('lender_tracker_last_updated', new Date().toISOString());
        setTimeout(() => setCloudSyncStatus('idle'), 3000);
      } catch (error) {
        console.error("Auto-backup failed:", error);

        // Check if it's a 401 error (token expired)
        if (error.message && error.message.includes('401')) {
          console.log('Token expired, logging out...');
          setUser(null);
          setAccessToken(null);
          clearSession();
          alert('⚠️ Your session has expired. Please log in again to continue cloud backups.');
          return; // Don't set error status, just logout
        }

        setCloudSyncStatus('error');
        setTimeout(() => setCloudSyncStatus('idle'), 3000);
      }
    };

    // Initial backup after login/load - wait 10s to allow sync to finish first
    const timer = setTimeout(autoBackup, 10000);

    // Set up interval
    const interval = setInterval(autoBackup, 5 * 60 * 1000); // 5 minutes
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [accessToken, user, loans]);

  // Live update timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = async (tokenResponse) => {
    try {
      const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });

      const email = res.data.email;

      if (ALLOWED_EMAILS.includes(email.toLowerCase())) {
        // 1. Success! Log the user in immediately
        setUser(res.data);
        setAccessToken(tokenResponse.access_token);
        saveSession(res.data, tokenResponse.access_token);

        // 2. Trigger sync in background (don't block login)
        try {
          await syncWithCloud(email, tokenResponse.access_token);
        } catch (syncError) {
          console.error("Background sync failed after login:", syncError);
          // We don't alert here because the user is already logged in successfully
        }
      } else {
        alert("Access Denied: Your email is not authorized.");
      }
    } catch (error) {
      console.error("Login process failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleDownloadBackup = () => {
    const success = downloadBackupFile(loans);
    if (success) {
      alert('✅ Backup file downloaded! Save it somewhere safe.');
    } else {
      alert('❌ Backup download failed.');
    }
  };

  const handleUploadBackup = async () => {
    if (!window.confirm('This will replace your current data with the backup file. Continue?')) {
      return;
    }

    try {
      const restoredLoans = await uploadBackupFile();
      setLoans(restoredLoans);
      alert(`✅ Restored ${restoredLoans.length} loans from backup file!`);
    } catch (error) {
      alert('❌ Restore failed: ' + error.message);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!window.confirm('This will restore your data from Google Drive cloud backup. Any unsaved local changes will be replaced. Continue?')) {
      return;
    }

    try {
      setCloudSyncStatus('syncing');
      const cloudLoans = await downloadEncryptedBackup(user.email, accessToken);
      if (cloudLoans && cloudLoans.length > 0) {
        setLoans(cloudLoans);
        alert(`✅ Restored ${cloudLoans.length} loans from secure cloud backup!`);
        setCloudSyncStatus('success');
        setTimeout(() => setCloudSyncStatus('idle'), 3000);
      } else {
        alert('⚠️ No cloud backup found.');
        setCloudSyncStatus('idle');
      }
    } catch (error) {
      alert('❌ Cloud restore failed: ' + error.message);
      setCloudSyncStatus('error');
      setTimeout(() => setCloudSyncStatus('idle'), 3000);
    }
  };

  const handleBackupToCloud = async () => {
    if (loans.length === 0) {
      alert('⚠️ No loans to backup.');
      return;
    }

    try {
      setCloudSyncStatus('syncing');
      await uploadEncryptedBackup(loans, user.email, accessToken);
      localStorage.setItem('lender_tracker_last_updated', new Date().toISOString());
      setCloudSyncStatus('success');
      alert(`✅ Successfully backed up ${loans.length} loans to Google Drive!`);
      setTimeout(() => setCloudSyncStatus('idle'), 3000);
    } catch (error) {
      setCloudSyncStatus('error');
      alert('❌ Cloud backup failed: ' + error.message);
      setTimeout(() => setCloudSyncStatus('idle'), 3000);
    }
  };

  const handleBulkUpdateRate = (loanIds, newRate) => {
    setLoans(prev => prev.map(loan => {
      if (loanIds.includes(loan.id)) {
        return {
          ...loan,
          rate: newRate
        };
      }
      return loan;
    }));
    alert(`✅ Updated interest rate to ${newRate}% for ${loanIds.length} loans!`);
  };

  // Borrower Profile Handlers
  const handleSaveProfile = (profile) => {
    saveBorrowerProfile(profile);
    const updated = loadBorrowerProfiles();
    setBorrowerProfiles(updated);
    alert(`✅ Profile saved for ${profile.name}`);
  };

  const handleDeleteProfile = (borrowerName) => {
    deleteBorrowerProfile(borrowerName);
    const updated = loadBorrowerProfiles();
    setBorrowerProfiles(updated);
    alert(`✅ Profile deleted for ${borrowerName}`);
  };

  const handleOpenProfileModal = (borrowerName = null) => {
    if (borrowerName) {
      const profile = borrowerProfiles.find(p => p.name === borrowerName);
      setEditingProfile(profile || { name: borrowerName, email: '', phone: '', documents: [] });
    } else {
      setEditingProfile(null);
    }
    setShowProfileModal(true);
  };





  const handleAddLoan = (newLoan) => {
    setLoans(prev => [...prev, newLoan]);
  };

  const handleEditLoan = (loan) => {
    setEditingLoan(loan);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedLoan) => {
    setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
    setEditingLoan(null);
  };

  const handleDeleteLoan = (loanId) => {
    setLoans(prev => prev.filter(l => l.id !== loanId));
  };

  const handlePayInterest = (loan) => {
    if (window.confirm(`Confirm interest payment for ${loan.borrower}? This will reset the start date to today.`)) {
      const updatedLoan = {
        ...loan,
        startDate: new Date().toISOString().split('T')[0]
      };
      setLoans(prev => prev.map(l => l.id === loan.id ? updatedLoan : l));
    }
  };

  const handleBulkUpdateLoanType = (borrowerName, loanType, tenure) => {
    setLoans(prev => prev.map(loan => {
      if (loan.borrower === borrowerName) {
        return {
          ...loan,
          loanType: loanType,
          tenure: loanType === 'emi' ? tenure : null
        };
      }
      return loan;
    }));
    alert(`✅ Updated all loans for ${borrowerName} to ${loanType.toUpperCase()} type!`);
  };


  const existingBorrowers = useMemo(() => {
    return [...new Set(loans.map(l => l.borrower))].sort();
  }, [loans]);

  if (!user) {
    return <Login onSuccess={handleLoginSuccess} onError={() => alert("Login Failed")} />;
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.875rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lender Tracker
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
            Welcome, {user.name}
          </p>

          {/* Borrower Selector */}
          <div style={{ marginTop: '1rem' }}>
            <select
              value={selectedBorrower}
              onChange={(e) => setSelectedBorrower(e.target.value)}
              className="input"
              style={{ padding: '0.5rem', fontSize: '0.9rem', maxWidth: '300px' }}
            >
              <option value="">View All Borrowers</option>
              {existingBorrowers.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Cloud Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
            {cloudSyncStatus === 'syncing' && <Cloud size={16} className="animate-pulse" style={{ color: 'var(--accent-primary)' }} />}
            {cloudSyncStatus === 'success' && <Cloud size={16} style={{ color: 'var(--success)' }} />}
            {cloudSyncStatus === 'error' && <CloudOff size={16} style={{ color: 'var(--danger)' }} />}
            {cloudSyncStatus === 'idle' && <Cloud size={16} style={{ color: 'var(--text-secondary)' }} />}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {cloudSyncStatus === 'syncing' ? 'Syncing...' : cloudSyncStatus === 'success' ? 'Secure' : cloudSyncStatus === 'error' ? 'Error' : 'Cloud'}
            </span>
          </div>

          <button onClick={handleDownloadBackup} className="btn btn-secondary" title="Download Backup File">
            <Download size={18} /> Download Backup
          </button>
          <button onClick={handleUploadBackup} className="btn btn-secondary" title="Upload Backup File">
            <Upload size={18} /> Upload Backup
          </button>
          <button onClick={handleRestoreFromCloud} className="btn btn-secondary" title="Restore from Google Drive">
            <Cloud size={18} /> Restore from Cloud
          </button>
          <button onClick={handleBackupToCloud} className="btn btn-secondary" title="Backup to Google Drive">
            <CloudUpload size={18} /> Backup to Cloud
          </button>
          <button onClick={() => handleOpenProfileModal()} className="btn btn-primary" title="Manage Borrower Profiles">
            👥 Manage Borrowers
          </button>
          <button
            onClick={() => {
              setUser(null);
              setAccessToken(null);
              clearSession();
            }}
            className="btn btn-secondary"
            title="Sign Out"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </header>

      {selectedBorrower ? (
        <BorrowerDashboard
          borrowerName={selectedBorrower}
          loans={loans.filter(l => l.borrower === selectedBorrower)}
          onBack={() => setSelectedBorrower('')}
          onEdit={handleEditLoan}
          onPayInterest={handlePayInterest}
          onDelete={handleDeleteLoan}
          onBulkUpdateLoanType={handleBulkUpdateLoanType}
          onBulkUpdateRate={handleBulkUpdateRate}
        />
      ) : (
        <>
          <SummaryCards loans={loans} />

          <EntryForm
            onAddLoan={handleAddLoan}
            existingBorrowers={existingBorrowers}
            loans={loans}
          />

          <LoanList
            loans={loans}
            borrowerProfiles={borrowerProfiles}
            onEdit={handleEditLoan}
            onPayInterest={handlePayInterest}
            onDelete={handleDeleteLoan}
          />
        </>
      )}

      <EditModal
        loan={editingLoan}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
      />

      <BorrowerProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={editingProfile}
        existingBorrowers={existingBorrowers}
        borrowerProfiles={borrowerProfiles}
        onSave={handleSaveProfile}
        onDelete={handleDeleteProfile}
      />

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <p>🔒 Data encrypted & auto-backed up to Google Drive • 💾 Local backup available</p>
        <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>
          {loans.length} loans • Last update: {new Date().toLocaleTimeString()}
        </p>
      </footer>
    </div>
  );
}

export default App;
