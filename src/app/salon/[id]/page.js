'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSalonDetails();
    }
  }, [params.id]);

  const fetchSalonDetails = async () => {
    try {
      setLoading(true);

      // Fetch salon details
      console.log('🔍 Fetching salon:', params.id);
      const salonRes = await fetch(`/api/salons/${params.id}`);

      if (!salonRes.ok) {
        throw new Error(`Salon API returned ${salonRes.status}`);
      }

      const salonData = await salonRes.json();
      console.log('📍 Salon data:', salonData);

      if (salonData.success) {
        setSalon(salonData.salon);

        // Fetch services for this salon
        try {
          console.log('🔍 Fetching services...');
          const servicesRes = await fetch(`/api/salons/${params.id}/services`);

          if (servicesRes.ok) {
            const servicesData = await servicesRes.json();
            console.log('✂️ Services:', servicesData);

            if (servicesData.success && servicesData.services) {
              setServices(servicesData.services);
            } else {
              console.warn('⚠️ No services found');
              setServices([]);
            }
          } else {
            console.warn('⚠️ Services API failed:', servicesRes.status);
            setServices([]);
          }
        } catch (error) {
          console.error('❌ Error fetching services:', error);
          setServices([]);
        }

        // Fetch staff for this salon
        try {
          console.log('🔍 Fetching staff...');
          const staffRes = await fetch(`/api/salons/${params.id}/staff`);

          if (staffRes.ok) {
            const staffData = await staffRes.json();
            console.log('👨‍💼 Staff:', staffData);

            if (staffData.success && staffData.staff) {
              setStaff(staffData.staff);
            } else {
              console.warn('⚠️ No staff found');
              setStaff([]);
            }
          } else {
            console.warn('⚠️ Staff API failed:', staffRes.status);
            setStaff([]);
          }
        } catch (error) {
          console.error('❌ Error fetching staff:', error);
          setStaff([]);
        }
      } else {
        throw new Error(salonData.error || 'Salon not found');
      }
    } catch (error) {
      console.error('❌ Error in fetchSalonDetails:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCheckIn = async () => {
    if (!customerName || !customerPhone) {
      alert('Please enter your name and phone number');
      return;
    }

    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    setCheckingIn(true);

    try {
      const response = await fetch('/api/queue/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: params.id,
          customerName,
          customerPhone,
          services: selectedServices,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Checked in successfully!\n\nQueue Position: #${data.queueEntry.position}\nEstimated Wait: ${data.queueEntry.estimatedWaitTime} minutes`);
        router.push(`/queue/${data.queueEntry._id}`);
      } else {
        alert('Failed to check in: ' + data.error);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Error during check-in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const getSelectedServicesTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s._id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const getSelectedServicesDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s._id === serviceId);
      return total + (service?.duration || 0);
    }, 0);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading salon details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!salon) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Salon not found</h2>
            <Link href="/find-salon" className="text-green-600 hover:text-green-700 font-semibold">
              ← Back to Find Salon
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-16 min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative h-80 bg-gradient-to-r from-green-600 to-blue-600">
          {salon.logo?.url ? (
            <div className="absolute inset-0">
              <img src={salon.logo.url} alt={salon.name} className="w-full h-full object-cover opacity-20" />
            </div>
          ) : null}

          <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
            <div>
              {salon.logo?.url && (
                <img src={salon.logo.url} alt={salon.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-xl" />
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{salon.name}</h1>
              {salon.address?.fullAddress && (
                <p className="text-white text-lg mb-4">📍 {salon.address.fullAddress}</p>
              )}
              <div className="flex items-center justify-center gap-4">
                {salon.rating > 0 && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-yellow-300 text-xl">⭐</span>
                    <span className="text-white font-bold">{salon.rating.toFixed(1)}</span>
                    <span className="text-white/80">({salon.totalReviews} reviews)</span>
                  </div>
                )}
                {salon.phone && (
                  <a href={`tel:${salon.phone}`} className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold hover:bg-white/30 transition-all">
                    📞 Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Services Section */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">✂️ Select Services</h2>
                  <span className="text-sm text-gray-600">{services.length} services available</span>
                </div>

                {services.length > 0 ? (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service._id}
                        onClick={() => toggleService(service._id)}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedServices.includes(service._id)
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service._id)}
                                onChange={() => { }}
                                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                              />
                              <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                            </div>
                            {service.description && (
                              <p className="text-sm text-gray-600 mb-3 ml-8">{service.description}</p>
                            )}
                            <div className="flex items-center gap-4 ml-8">
                              <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                ₹{service.price}
                              </span>
                              <span className="text-sm text-gray-600">
                                ⏱️ {service.duration} min
                              </span>
                              {service.category && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                  {service.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">✂️</div>
                    <p className="text-gray-600">No services available yet</p>
                    <p className="text-sm text-gray-500 mt-2">This salon hasn't added services</p>
                  </div>
                )}
              </div>

              {/* Staff Section */}
              {staff.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">👨‍💼 Our Staff</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {staff.map((member) => (
                      <div key={member._id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                        {member.photo?.url ? (
                          <img src={member.photo.url} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900">{member.name}</h3>
                          {member.specialization && (
                            <p className="text-sm text-gray-600">{member.specialization}</p>
                          )}
                          {member.experience && (
                            <p className="text-xs text-gray-500">{member.experience} years exp</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About Section */}
              {salon.description && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">ℹ️ About</h2>
                  <p className="text-gray-700 leading-relaxed">{salon.description}</p>
                </div>
              )}
            </div>

            {/* Sidebar - Check-in Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Check-In Details</h3>

                {selectedServices.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Selected Services</h4>
                      <ul className="space-y-2">
                        {selectedServices.map(serviceId => {
                          const service = services.find(s => s._id === serviceId);
                          return service ? (
                            <li key={service._id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{service.name}</span>
                              <span className="font-semibold text-green-600">₹{service.price}</span>
                            </li>
                          ) : null;
                        })}
                      </ul>
                      <div className="border-t border-green-200 mt-3 pt-3 flex items-center justify-between">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-green-600 text-lg">₹{getSelectedServicesTotal()}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        ⏱️ Estimated time: {getSelectedServicesDuration()} minutes
                      </div>
                    </div>

                    {/* Customer Info Form */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter your name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="+91 1234567890"
                          required
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCheckIn}
                      disabled={checkingIn || !customerName || !customerPhone}
                      className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${checkingIn || !customerName || !customerPhone
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl'
                        }`}
                    >
                      {checkingIn ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Checking In...
                        </span>
                      ) : (
                        '✅ Check In Now'
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      You'll receive your queue position after check-in
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">✂️</div>
                    <p className="text-gray-600 font-medium">Select services to check in</p>
                    <p className="text-sm text-gray-500 mt-2">Choose at least one service to continue</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  {salon.googleMapsLink && (
                    <a
                      href={salon.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-lg text-center font-semibold hover:bg-blue-200 transition-all"
                    >
                      🗺️ Get Directions
                    </a>
                  )}
                  <Link
                    href="/find-salon"
                    className="block w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-center font-semibold hover:bg-gray-200 transition-all"
                  >
                    ← Back to Salons
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
