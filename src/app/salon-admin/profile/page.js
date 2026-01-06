'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    openingHours: [],
    logo: null,
    images: [],
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (user?.salonId) {
      fetchSalonProfile();
    }
  }, [user]);

  const fetchSalonProfile = async () => {
    try {
      const response = await fetch(`/api/salons/${user.salonId}`);
      const data = await response.json();
      
      if (data.salon) {
        setSalon(data.salon);
        setFormData({
          name: data.salon.name || '',
          description: data.salon.description || '',
          phone: data.salon.phone || '',
          email: data.salon.email || '',
          address: data.salon.address || { street: '', city: '', state: '', zipCode: '' },
          openingHours: data.salon.openingHours || weekDays.map(day => ({
            day,
            open: '09:00',
            close: '21:00',
            isClosed: false,
          })),
          logo: data.salon.logo || null,
          images: data.salon.images || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch salon profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const formDataImg = new FormData();
    formDataImg.append('file', file);
    formDataImg.append('folder', 'salon-logos');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataImg,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          logo: { url: data.url, publicId: data.publicId }
        }));
      } else {
        alert('Failed to upload logo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingGallery(true);

    try {
      const uploadedImages = [];
      
      for (const file of files) {
        const formDataImg = new FormData();
        formDataImg.append('file', file);
        formDataImg.append('folder', 'salon-gallery');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataImg,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedImages.push({ 
            url: data.url, 
            publicId: data.publicId,
            type: 'gallery'
          });
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateOpeningHours = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: prev.openingHours.map((hour, i) => 
        i === index ? { ...hour, [field]: value } : hour
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fullAddress = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}`;
      
      const response = await fetch(`/api/salons/${user.salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          address: {
            ...formData.address,
            fullAddress,
          },
        }),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        fetchSalonProfile();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout requiredRole="salon-admin">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredRole="salon-admin">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Salon Profile</h1>
          <p className="text-gray-600 mt-2">Manage your salon information and settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salon Logo
                </label>
                {formData.logo?.url && (
                  <img src={formData.logo.url} alt="Logo" className="w-32 h-32 object-cover rounded-lg mb-3" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {uploadingLogo && <p className="text-sm text-gray-500 mt-2">Uploading logo...</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salon Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, zipCode: e.target.value }
                    })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Opening Hours</h2>
            
            <div className="space-y-3">
              {formData.openingHours.map((hours, index) => (
                <div key={hours.day} className="flex items-center gap-4">
                  <div className="w-32">
                    <span className="font-medium text-gray-700">{hours.day}</span>
                  </div>
                  
                  <input
                    type="checkbox"
                    checked={!hours.isClosed}
                    onChange={(e) => updateOpeningHours(index, 'isClosed', !e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">Open</span>

                  {!hours.isClosed && (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateOpeningHours(index, 'open', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateOpeningHours(index, 'close', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </>
                  )}

                  {hours.isClosed && (
                    <span className="text-red-600 font-medium">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photo Gallery</h2>
            
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                disabled={uploadingGallery}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {uploadingGallery && <p className="text-sm text-gray-500 mt-2">Uploading images...</p>}
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || uploadingLogo || uploadingGallery}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                saving || uploadingLogo || uploadingGallery
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
