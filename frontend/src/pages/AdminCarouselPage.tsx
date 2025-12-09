import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { carouselApi, CarouselImage } from '../api/carousel';
import { uploadImage } from '../api/upload';

const AdminCarouselPage: React.FC = () => {
  const { token } = useAuth();
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    imageUrl: '',
    altText: '',
    order: 0,
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const data = await carouselApi.getAdminImages();
      setImages(data);
    } catch (err: any) {
      setError('Failed to load carousel images');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clear the imageUrl field when file is selected
      setFormData({ ...formData, imageUrl: '' });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    setError('');

    try {
      const uploadedUrl = await uploadImage(selectedFile, token);
      setFormData({ ...formData, imageUrl: uploadedUrl });
      setSuccess('Image uploaded successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate imageUrl
    if (!formData.imageUrl || formData.imageUrl.trim() === '') {
      setError('Please provide an image URL or upload an image first');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        await carouselApi.updateImage(editingId, formData);
        setSuccess('Carousel image updated successfully');
      } else {
        await carouselApi.uploadImage(formData);
        setSuccess('Carousel image added successfully');
      }
      setFormData({ imageUrl: '', altText: '', order: 0 });
      setShowForm(false);
      setEditingId(null);
      setSelectedFile(null);
      setPreviewUrl('');
      loadImages();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save carousel image');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (image: CarouselImage) => {
    setFormData({
      imageUrl: image.imageUrl,
      altText: image.altText || '',
      order: image.order,
    });
    setEditingId(image._id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this carousel image?')) {
      return;
    }

    try {
      await carouselApi.deleteImage(id);
      setSuccess('Carousel image deleted successfully');
      loadImages();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete carousel image');
    }
  };

  const handleToggleActive = async (image: CarouselImage) => {
    try {
      await carouselApi.updateImage(image._id, { isActive: !image.isActive });
      setSuccess(`Carousel image ${!image.isActive ? 'activated' : 'deactivated'} successfully`);
      loadImages();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update carousel image');
    }
  };

  const handleCancel = () => {
    setFormData({ imageUrl: '', altText: '', order: 0 });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const availableOrders = Array.from({ length: 8 }, (_, i) => i).filter(
    (order) => !images.some((img) => img.order === order && img._id !== editingId)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Carousel</h1>
          {!showForm && images.length < 8 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              + Add Carousel Image
            </button>
          )}
        </div>
        <p className="text-gray-600 mt-2">
          Manage homepage carousel images (maximum 8 images)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Carousel Image' : 'Add Carousel Image'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload Option */}
            <div>
              <label className="label">Upload Image from Computer</label>
              <div className="flex gap-2 items-start">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {selectedFile && !formData.imageUrl && (
                  <button
                    type="button"
                    onClick={handleUploadFile}
                    disabled={uploading}
                    className="btn-primary whitespace-nowrap"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img src={previewUrl} alt="Preview" className="h-32 rounded-lg object-cover" />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Upload an image from your computer (max 5MB, recommended size: 1920x600px)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div>
              <label className="label">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="input"
                placeholder="https://example.com/image.jpg"
                disabled={!!selectedFile && !formData.imageUrl}
              />
              <p className="text-sm text-gray-500 mt-1">
                Or paste a URL to an existing image
              </p>
            </div>

            <div>
              <label className="label">Alt Text</label>
              <input
                type="text"
                value={formData.altText}
                onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                className="input"
                placeholder="Description of the image"
              />
            </div>

            <div>
              <label className="label">Order (0-7) *</label>
              <select
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="input"
                required
              >
                {availableOrders.map((order) => (
                  <option key={order} value={order}>
                    {order}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Lower numbers appear first in the carousel
              </p>
            </div>

            {formData.imageUrl && (
              <div>
                <label className="label">Preview</label>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt={formData.altText || 'Preview'}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1920x600?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Image' : 'Add Image'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Images List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alt Text</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {images.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No carousel images found. Add your first image to get started.
                  </td>
                </tr>
              ) : (
                images.map((image) => (
                  <tr key={image._id}>
                    <td className="px-6 py-4">
                      <img
                        src={image.imageUrl}
                        alt={image.altText || `Slide ${image.order}`}
                        className="h-20 w-32 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{image.order}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{image.altText || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(image)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          image.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {image.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(image)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(image._id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {images.length >= 8 && !showForm && (
        <div className="mt-4 bg-yellow-50 text-yellow-800 p-4 rounded-lg">
          <p className="font-medium">Maximum carousel images reached</p>
          <p className="text-sm">You have reached the maximum of 8 carousel images. Delete one to add a new image.</p>
        </div>
      )}
    </div>
  );
};

export default AdminCarouselPage;
