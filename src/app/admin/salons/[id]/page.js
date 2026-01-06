'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import dynamic from 'next/dynamic';

// Import Map component dynamically to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function SalonDetailsPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
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
    coordinates: [78.4867, 17.385],
    openingHours: [],
    logo: null,
    images: [],
    status: 'approved',
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchSalonDetails();
  }, [resolvedParams.id]);

  const fetchSalonDetails = async () => {
    try {
      const response = await fetch(`/api/salons/${resolvedParams.id}`);
      const data = await response.json();
      
      if (data.salon) {
        setSalon(data.salon);
        setFormData({
          name: data.salon.name || '',
          description: data.salon.description || '',
          phone: data.salon.phone || '',
          email: data.salon.email || '',
          address: data.salon.address || { street: '', city: '', state: '', zipCode: '' },
          coordinates: data.salon.coordinates || [78.4867, 17.385],
          openingHours: data.salon.openingHours || weekDays.map(day => ({
            day,
            open: '09:00',
            close: '21:00',
            isClosed: false,
          })),
          logo: data.salon.logo || null,
          images: data.salon.images || [],
          status: data.salon.status || 'approved',
        });
      }
    } catch (error) {
      console.error('Failed to fetch salon details:', error);
      toast.error('Failed to load salon details');
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
        toast.success('Logo uploaded successfully!');
      } else {
        toast.error('Failed to upload logo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingGallery(true);
    toast.info(`Uploading ${files.length} image(s)...`);

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
      toast.success(`${uploadedImages.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = async (index) => {
    const confirmed = await confirm({
      title: 'Remove Image',
      message: 'Are you sure you want to remove this image from the gallery?',
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (!confirmed) return;

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    toast.info('Image removed');
  };

  const updateOpeningHours = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: prev.openingHours.map((hour, i) => 
        i === index ? { ...hour, [field]: value } : hour
      )
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMapClick = (lat, lng) => {
    if (editing) {
      setFormData(prev => ({
        ...prev,
        coordinates: [lng, lat] // Note: [longitude, latitude] format
      }));
      toast.success('Location updated on map');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fullAddress = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}`;
      
      const response = await fetch(`/api/salons/${resolvedParams.id}`, {
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
        toast.success('Salon updated successfully!');
        setEditing(false);
        fetchSalonDetails();
      } else {
        toast.error('Failed to update salon');
      }
    } catch (error) {
      console.error('Error updating salon:', error);
      toast.error('Error updating salon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Salon',
      message: `Are you sure you want to delete "${salon.name}"? This action cannot be undone and all related data (staff, services, bookings) will be permanently removed.`,
      confirmText: 'Yes, Delete Forever',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/salons/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Salon deleted successfully');
        setTimeout(() => {
          router.push('/admin/salons');
        }, 1000);
      } else {
        toast.error('Failed to delete salon');
      }
    } catch (error) {
      console.error('Error deleting salon:', error);
      toast.error('Error deleting salon');
    }
  };

  const handleStatusChange = async (newStatus) => {
    const statusMessages = {
      approved: 'This will allow the salon to accept bookings.',
      pending: 'This will put the salon under review.',
      suspended: 'This will temporarily disable the salon and prevent new bookings.',
      rejected: 'This will permanently reject this salon.',
    };

    const confirmed = await confirm({
      title: 'Change Salon Status',
      message: `Are you sure you want to mark this salon as ${newStatus}? ${statusMessages[newStatus] || ''}`,
      confirmText: `Yes, Mark as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      cancelText: 'Cancel',
      type: newStatus === 'rejected' || newStatus === 'suspended' ? 'warning' : 'default',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/salons/${resolvedParams.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Salon status changed to ${newStatus}`);
        fetchSalonDetails();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminLayout requiredRole="main-admin">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salon details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!salon) {
    return (
      <AdminLayout requiredRole="main-admin">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-gray-500 text-lg">Salon not found</p>
          <Link href="/admin/salons">
            <button className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Back to All Salons
            </button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/salons">
            <button className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-2">
              ← Back to All Salons
            </button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">{salon.name}</h1>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(salon.status)}`}>
                {salon.status}
              </span>
            </div>
            <div className="flex gap-3">
              {!editing ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✏️ Edit Salon
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchSalonDetails();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Management</h2>
            <div className="flex gap-3 flex-wrap">
              {['approved', 'pending', 'suspended', 'rejected'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  disabled={salon.status === status}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    salon.status === status
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

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
                {editing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {uploadingLogo && <p className="text-sm text-gray-500 mt-2">Uploading logo...</p>}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salon Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={!editing}
                  rows={4}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                    }`}
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
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAP LOCATION */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📍 Map Location</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {editing 
                  ? 'Click on the map to set the exact location of the salon'
                  : 'Current location of the salon'}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.coordinates[1]?.toFixed(6) || '0.000000'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.coordinates[0]?.toFixed(6) || '0.000000'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-200">
              <MapView
                salons={[{
                  _id: salon._id,
                  name: formData.name,
                  address: formData.address,
                  coordinates: formData.coordinates,
                  phone: formData.phone,
                  logo: formData.logo,
                }]}
                center={[formData.coordinates[1], formData.coordinates[0]]}
                zoom={15}
                onMapClick={editing ? handleMapClick : null}
              />
            </div>
            
            {editing && (
              <p className="text-xs text-blue-600 mt-2">
                💡 Tip: Click anywhere on the map to update the salon's location
              </p>
            )}
          </div>

          {/* Admin Information */}
          {salon.adminId && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{salon.adminId.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{salon.adminId.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900">{salon.adminId.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-900">{salon.adminId.isActive ? '✅ Active' : '❌ Inactive'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Opening Hours */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Opening Hours</h2>
            
            <div className="space-y-3">
              {formData.openingHours.map((hours, index) => (
                <div key={hours.day} className="flex items-center gap-4">
                  <div className="w-32">
                    <span className="font-medium text-gray-700">{hours.day}</span>
                  </div>
                  
                  {editing && (
                    <>
                      <input
                        type="checkbox"
                        checked={!hours.isClosed}
                        onChange={(e) => updateOpeningHours(index, 'isClosed', !e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600">Open</span>
                    </>
                  )}

                  {!hours.isClosed ? (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateOpeningHours(index, 'open', e.target.value)}
                        disabled={!editing}
                        className={`px-3 py-2 border border-gray-300 rounded-lg ${
                          editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                        }`}
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateOpeningHours(index, 'close', e.target.value)}
                        disabled={!editing}
                        className={`px-3 py-2 border border-gray-300 rounded-lg ${
                          editing ? 'focus:ring-2 focus:ring-green-500 focus:border-transparent' : 'bg-gray-50'
                        }`}
                      />
                    </>
                  ) : (
                    <span className="text-red-600 font-medium">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photo Gallery</h2>
            
            {editing && (
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
            )}

            {formData.images.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {editing && (
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No gallery images</p>
            )}
          </div>

          {/* Staff & Services Count */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Staff Members</h3>
              <p className="text-3xl font-bold text-green-600">{salon.staff?.length || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Services</h3>
              <p className="text-3xl font-bold text-green-600">{salon.services?.length || 0}</p>
            </div>
          </div>

          {/* Save Button */}
          {editing && (
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
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
