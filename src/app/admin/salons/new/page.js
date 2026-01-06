'use client';
import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function NewSalonPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
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
    coordinates: [78.4867, 17.385], // Default: Hyderabad [longitude, latitude]
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    openingHours: [
      { day: 'Monday', open: '09:00', close: '21:00', isClosed: false },
      { day: 'Tuesday', open: '09:00', close: '21:00', isClosed: false },
      { day: 'Wednesday', open: '09:00', close: '21:00', isClosed: false },
      { day: 'Thursday', open: '09:00', close: '21:00', isClosed: false },
      { day: 'Friday', open: '09:00', close: '21:00', isClosed: false },
      { day: 'Saturday', open: '09:00', close: '21:00', isClosed: false },
      { day: 'Sunday', open: '09:00', close: '21:00', isClosed: false },
    ],
    logo: null,
    images: [],
  });

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

  const removeGalleryImage = (index) => {
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
    setFormData(prev => ({
      ...prev,
      coordinates: [lng, lat] // [longitude, latitude]
    }));
    toast.success('Location updated on map');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullAddress = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}`;
      
      const response = await fetch('/api/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          email: formData.email,
          address: {
            ...formData.address,
            fullAddress,
          },
          coordinates: formData.coordinates,
          openingHours: formData.openingHours,
          logo: formData.logo,
          images: formData.images,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPhone: formData.adminPhone,
          adminPassword: formData.adminPassword,
        }),
      });

      if (response.ok) {
        toast.success('Salon created successfully!');
        setTimeout(() => {
          router.push('/admin/salons');
        }, 1500);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create salon');
      }
    } catch (error) {
      console.error('Error creating salon:', error);
      toast.error('Error creating salon');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Add New Salon</h1>
          <p className="text-gray-600 mt-2">Create a new salon with admin account</p>
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
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
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
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
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
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
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
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
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
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
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
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAP LOCATION */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📍 Set Map Location</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Click on the map to set the exact location of the salon
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
                  _id: 'new',
                  name: formData.name || 'New Salon',
                  address: formData.address,
                  coordinates: formData.coordinates,
                  phone: formData.phone,
                  logo: formData.logo,
                }]}
                center={[formData.coordinates[1], formData.coordinates[0]]}
                zoom={15}
                onMapClick={handleMapClick}
              />
            </div>
            
            <p className="text-xs text-blue-600 mt-2">
              💡 Tip: Click anywhere on the map to set the salon's location. You can zoom in/out for precision.
            </p>
          </div>

          {/* Admin Account */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Account Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Phone
                  </label>
                  <input
                    type="tel"
                    name="adminPhone"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
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
                </div>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photo Gallery (Optional)</h2>
            
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
              disabled={loading || uploadingLogo || uploadingGallery}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                loading || uploadingLogo || uploadingGallery
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Creating Salon...' : '✨ Create Salon'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
