import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileApi, UserProfile } from '../api/profile';
import { uploadImage } from '../api/upload';

const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    courierNotes: '',
    profilePhoto: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        courierNotes: data.courierNotes || '',
        profilePhoto: data.profilePhoto || '',
      });
    } catch (err: any) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    setError('');

    try {
      const uploadedUrl = await uploadImage(selectedFile, token);
      setFormData({ ...formData, profilePhoto: uploadedUrl });
      setSuccess('Photo uploaded successfully');
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedProfile = await profileApi.updateProfile(formData);
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        address: profile.address || '',
        phoneNumber: profile.phoneNumber || '',
        courierNotes: profile.courierNotes || '',
        profilePhoto: profile.profilePhoto || '',
      });
    }
    setIsEditing(false);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setError('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwData.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(pwData.newPassword)) {
      setPwError('New password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(pwData.newPassword)) {
      setPwError('New password must contain at least one number');
      return;
    }
    setPwSaving(true);
    try {
      await profileApi.changePassword(pwData.currentPassword, pwData.newPassword);
      setPwSuccess('Password changed successfully');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPwForm(false);
    } catch (err: any) {
      setPwError(err.response?.data?.message || err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 mb-4"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
          <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Branded header banner ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 60%, #111e55 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.07]" style={{ backgroundColor: '#E31E24' }} />
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.2)' }}>
              {formData.profilePhoto || previewUrl
                ? <img src={previewUrl || formData.profilePhoto} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
                : (profile?.name?.[0] || user?.email?.[0] || '?').toUpperCase()
              }
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#fca5a5' }}>My Account</p>
              <h1 className="text-2xl font-extrabold text-white">{profile?.name || user?.email}</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{profile?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar quick links ── */}
          <div className="lg:w-56 shrink-0 space-y-2">
            {[
              { to: '/orders', emoji: '📦', label: 'My MTG Orders' },
              { to: '/wishlist', emoji: '❤️', label: 'My Wishlist' },
              { to: '/catalog', emoji: '🃏', label: 'Browse Cards' },
              { to: '/cafe', emoji: '🎲', label: 'Boardgame Café' },
              { to: '/consoles', emoji: '🎮', label: 'Console Rental' },
              { to: '/cart', emoji: '🛒', label: 'My Cart' },
            ].map(({ to, emoji, label }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                <span>{emoji}</span>
                {label}
                <svg className="w-3.5 h-3.5 ml-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>

          {/* ── Main profile card ── */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Profile Information</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Used for MTG card deliveries</p>
            </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>
            {success}
          </div>
        )}

        <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          {/* Profile Photo Section */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-4 md:mb-6 pb-4 md:pb-6 border-b">
            <div className="flex-shrink-0">
              {formData.profilePhoto || previewUrl ? (
                <img
                  src={previewUrl || formData.profilePhoto}
                  alt="Profile"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
                  style={{ border: '4px solid var(--color-border)' }}
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)', border: '4px solid var(--color-border)' }}>
                  <span className="text-3xl md:text-4xl" style={{ color: 'var(--color-text-secondary)' }}>
                    {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="flex-1 w-full md:w-auto">
                <label className="label text-sm md:text-base">Profile Photo</label>
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-xs md:file:text-sm file:font-semibold
                      file:cursor-pointer"
                    style={{
                      color: 'var(--color-text-secondary)'
                    }}
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleUploadPhoto}
                      disabled={uploading}
                      className="btn-primary whitespace-nowrap text-sm md:text-base w-full sm:w-auto"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>
                <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Upload a profile photo (max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="input"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Email cannot be changed</p>
                </div>

                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="label">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Enter your shipping address"
                  />
                </div>

                <div>
                  <label className="label">Notes for Courier (Optional)</label>
                  <textarea
                    value={formData.courierNotes}
                    onChange={(e) => setFormData({ ...formData, courierNotes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="e.g., Ring the doorbell, Leave at the gate"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-4 md:mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm md:text-base"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="input"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Email cannot be changed</p>
                </div>

                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    disabled
                    className="input"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    disabled
                    className="input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="label">Address</label>
                  <textarea
                    value={formData.address}
                    disabled
                    className="input"
                    rows={3}
                    placeholder="Enter your shipping address"
                  />
                </div>

                <div>
                  <label className="label">Notes for Courier (Optional)</label>
                  <textarea
                    value={formData.courierNotes}
                    disabled
                    className="input"
                    rows={2}
                    placeholder="e.g., Ring the doorbell, Leave at the gate"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-4 md:mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-primary text-sm md:text-base"
                >
                  Edit Profile
                </button>
                <Link to="/orders" className="btn-secondary text-sm md:text-base text-center">
                  View Order History
                </Link>
              </div>
            </div>
          )}
        </div>

            {/* ── Change Password card ── */}
            <div className="mt-6 rounded-2xl shadow-sm p-6" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Change Password</h2>
                <button
                  type="button"
                  onClick={() => { setShowPwForm(v => !v); setPwError(''); setPwSuccess(''); }}
                  className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
                >
                  {showPwForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {pwSuccess && !showPwForm && (
                <div className="mt-3 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>
                  {pwSuccess}
                </div>
              )}

              {showPwForm && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                  {pwError && (
                    <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                      {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>
                      {pwSuccess}
                    </div>
                  )}
                  <div>
                    <label className="label">Current Password</label>
                    <input
                      type="password"
                      value={pwData.currentPassword}
                      onChange={e => setPwData({ ...pwData, currentPassword: e.target.value })}
                      className="input"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input
                      type="password"
                      value={pwData.newPassword}
                      onChange={e => setPwData({ ...pwData, newPassword: e.target.value })}
                      className="input"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input
                      type="password"
                      value={pwData.confirmPassword}
                      onChange={e => setPwData({ ...pwData, confirmPassword: e.target.value })}
                      className="input"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={pwSaving} className="btn-primary text-sm">
                      {pwSaving ? 'Saving...' : 'Save New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
