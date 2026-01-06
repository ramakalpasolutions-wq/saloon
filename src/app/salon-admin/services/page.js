'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: 'haircut',
    image: null,
    isActive: true,
  });

  const categories = [
    { value: 'haircut', label: 'Haircut' },
    { value: 'coloring', label: 'Hair Coloring' },
    { value: 'styling', label: 'Hair Styling' },
    { value: 'treatment', label: 'Hair Treatment' },
    { value: 'facial', label: 'Facial' },
    { value: 'spa', label: 'Spa' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (user?.salonId) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?salonId=${user.salonId}`);
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataImg = new FormData();
    formDataImg.append('file', file);
    formDataImg.append('folder', 'service-images');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataImg,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          image: { url: data.url, publicId: data.publicId }
        }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingService ? `/api/services/${editingService._id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
        }),
      });

      if (response.ok) {
        alert(editingService ? 'Service updated successfully' : 'Service added successfully');
        setShowModal(false);
        resetForm();
        fetchServices();
      } else {
        alert('Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration: service.duration,
      category: service.category,
      image: service.image || null,
      isActive: service.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Service deleted');
        fetchServices();
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service');
    }
  };

  const toggleActive = async (serviceId, currentStatus) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: 'haircut',
      image: null,
      isActive: true,
    });
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  return (
    <AdminLayout requiredRole="salon-admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
            <p className="text-gray-600 mt-2">Manage your salon services and pricing</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            <span>Add Service</span>
          </button>
        </div>

        {/* Services by Category */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">✂️</div>
            <p className="text-gray-500 text-lg mb-4">No services added yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Service
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(({ value, label }) => {
              const categoryServices = groupedServices[value];
              if (!categoryServices || categoryServices.length === 0) return null;

              return (
                <div key={value}>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">{label}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryServices.map((service) => (
                      <div
                        key={service._id}
                        className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                          !service.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Service Image */}
                        {service.image?.url ? (
                          <img
                            src={service.image.url}
                            alt={service.name}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center text-6xl">
                            ✂️
                          </div>
                        )}

                        {/* Service Info */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                            <button
                              onClick={() => toggleActive(service._id, service.isActive)}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                service.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {service.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-green-600">₹{service.price}</div>
                              <div className="text-sm text-gray-500">{service.duration} minutes</div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(service._id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {uploadingImage && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                  {formData.image && (
                    <img src={formData.image.url} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
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
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Service is active and available for booking
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImage}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                      uploadingImage
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {editingService ? 'Update' : 'Add'} Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
