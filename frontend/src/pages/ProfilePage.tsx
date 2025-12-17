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
    setPreviewUrl('');
    setError('');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>My Profile</h1>
          <p className="text-sm md:text-base mt-1 md:mt-2" style={{ color: 'var(--color-text-secondary)' }}>Manage your account information</p>
        </div>

        {error && (
          <div className="alert-error mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="alert-success mb-4">
            {success}
          </div>
        )}

        <div className="rounded-lg shadow-md p-4 md:p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
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
      </div>
    </div>
  );
};

export default ProfilePage;
