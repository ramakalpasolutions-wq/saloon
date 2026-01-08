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
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);  // ✅ NEW: Selected staff
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSalonDetails();
    }
    
    const today = new Date().toISOString().split('T')[0];
    setAppointmentDate(today);
  }, [params.id]);

  const fetchSalonDetails = async () => {
    try {
      setLoading(true);
      
      const salonRes = await fetch(`/api/salons/${params.id}`);
      const salonData = await salonRes.json();
      
      if (salonData.success) {
        setSalon(salonData.salon);
        
        const servicesRes = await fetch(`/api/salons/${params.id}/services`);
        const servicesData = await servicesRes.json();
        if (servicesData.success) {
          setServices(servicesData.services);
        }
        
        const staffRes = await fetch(`/api/salons/${params.id}/staff`);
        const staffData = await staffRes.json();
        if (staffData.success) {
          setStaff(staffData.staff);
        }
      }
    } catch (error) {
      console.error('Error fetching salon details:', error);
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

  // ✅ NEW: Handle staff selection
  const handleStaffSelect = (staffId) => {
    setSelectedStaff(staffId === selectedStaff ? null : staffId);
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

    if (!appointmentDate) {
      alert('Please select a date');
      return;
    }

    if (!appointmentTime) {
      alert('Please select a time');
      return;
    }

    // ✅ VALIDATE STAFF SELECTION (optional or required)
    if (!selectedStaff) {
      const confirmWithoutStaff = confirm('No staff selected. Continue with any available staff?');
      if (!confirmWithoutStaff) {
        return;
      }
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
          appointmentDate,
          appointmentTime,
          staffId: selectedStaff,  // ✅ ADD STAFF ID
        }),
      });

      const data = await response.json();

      if (data.success) {
        const staffName = selectedStaff ? staff.find(s => s._id === selectedStaff)?.name : 'Any available staff';
        alert(`✅ Checked in successfully!\n\nQueue Position: #${data.queueEntry.position}\nStaff: ${staffName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`);
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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
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
          <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
            <div>
              {salon.logo?.url && (
                <img src={salon.logo.url} alt={salon.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-xl" />
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{salon.name}</h1>
              <p className="text-white text-lg mb-4">📍 {salon.address}, {salon.city}</p>
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
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          selectedServices.includes(service._id)
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
                                onChange={() => {}}
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
                  </div>
                )}
              </div>

              {/* ✅ STAFF SELECTION SECTION */}
              {staff.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">👨‍💼 Select Staff (Optional)</h2>
                    <span className="text-sm text-gray-600">{staff.length} staff available</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {staff.map((member) => (
                      <div
                        key={member._id}
                        onClick={() => handleStaffSelect(member._id)}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedStaff === member._id
                            ? 'border-green-600 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Staff Photo */}
                        {member.photo?.url ? (
                          <img src={member.photo.url} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        
                        {/* Staff Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{member.name}</h3>
                            {selectedStaff === member._id && (
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
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
                  
                  {selectedStaff && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Selected:</span> {staff.find(s => s._id === selectedStaff)?.name}
                      </p>
                    </div>
                  )}
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
                        ⏱️ Duration: {getSelectedServicesDuration()} min
                      </div>
                    </div>

                    {/* ✅ SELECTED STAFF DISPLAY */}
                    {selectedStaff && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Selected Staff</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                            {staff.find(s => s._id === selectedStaff)?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{staff.find(s => s._id === selectedStaff)?.name}</p>
                            <p className="text-xs text-gray-600">{staff.find(s => s._id === selectedStaff)?.specialization}</p>
                          </div>
                        </div>
                      </div>
                    )}

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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date *</label>
                        <input
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time *</label>
                        <select
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        >
                          <option value="">Select time</option>
                          {generateTimeSlots().map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckIn}
                      disabled={checkingIn || !customerName || !customerPhone || !appointmentDate || !appointmentTime}
                      className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
                        checkingIn || !customerName || !customerPhone || !appointmentDate || !appointmentTime
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
