'use client';
import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckIn({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate next 7 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  // Available time slots
  const timeSlots = [
    { id: 1, time: '9:00 AM', available: true },
    { id: 2, time: '10:00 AM', available: true },
    { id: 3, time: '11:00 AM', available: false },
    { id: 4, time: '12:00 PM', available: true },
    { id: 5, time: '1:00 PM', available: true },
    { id: 6, time: '2:00 PM', available: true },
    { id: 7, time: '3:00 PM', available: false },
    { id: 8, time: '4:00 PM', available: true },
    { id: 9, time: '5:00 PM', available: true },
    { id: 10, time: '6:00 PM', available: true },
  ];

  // Staff members
  const staffMembers = [
    { id: 1, name: 'Rajesh Kumar', specialty: 'Senior Stylist', rating: 4.8, image: '👨' },
    { id: 2, name: 'Priya Sharma', specialty: 'Hair Color Expert', rating: 4.9, image: '👩' },
    { id: 3, name: 'Amit Patel', specialty: 'Barber Specialist', rating: 4.7, image: '👨' },
    { id: 4, name: 'Sneha Reddy', specialty: 'Makeup Artist', rating: 4.8, image: '👩' },
  ];

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dayName: days[date.getDay()],
      dayNum: date.getDate(),
      month: months[date.getMonth()],
      fullDate: date.toISOString().split('T')[0]
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    if (!selectedTimeSlot) {
      alert('Please select a time slot');
      return;
    }

    if (!selectedStaff) {
      alert('Please select a staff member');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      router.push(`/queue-status/${resolvedParams.id}?phone=${phoneNumber}&date=${selectedDate}&time=${selectedTimeSlot}&staff=${selectedStaff}`);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button 
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
              <p className="text-sm text-gray-600">Complete your booking details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Date
              </label>
              <div className="grid grid-cols-7 gap-2">
                {dates.map((date) => {
                  const formatted = formatDate(date);
                  const isSelected = selectedDate === formatted.fullDate;
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <button
                      key={formatted.fullDate}
                      type="button"
                      onClick={() => setSelectedDate(formatted.fullDate)}
                      className={`p-2 rounded-lg text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-xs font-medium">{formatted.dayName}</div>
                      <div className="text-lg font-bold">{formatted.dayNum}</div>
                      {isToday && <div className="text-xs">{formatted.month}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Time Slot
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto">
                {timeSlots.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.time;
                  
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => slot.available && setSelectedTimeSlot(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : slot.available
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Choose Your Stylist
              </label>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {staffMembers.map((staff) => {
                  const isSelected = selectedStaff === staff.name;
                  
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => setSelectedStaff(staff.name)}
                      className={`w-full p-4 rounded-lg text-left transition-all border-2 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="text-4xl mr-4">{staff.image}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                          <p className="text-sm text-gray-600">{staff.specialty}</p>
                          <div className="flex items-center mt-1">
                            <svg className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm text-gray-600 ml-1">{staff.rating}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone Number
              </label>
              <div className="flex">
                <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                  <span className="text-gray-600 font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll send you booking confirmation and reminders
              </p>
            </div>

            {/* Booking Summary */}
            {(selectedDate || selectedTimeSlot || selectedStaff) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  {selectedDate && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Date: <strong>{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</strong></span>
                    </div>
                  )}
                  {selectedTimeSlot && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Time: <strong>{selectedTimeSlot}</strong></span>
                    </div>
                  )}
                  {selectedStaff && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Stylist: <strong>{selectedStaff}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || phoneNumber.length !== 10 || !selectedDate || !selectedTimeSlot || !selectedStaff}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
                isSubmitting || phoneNumber.length !== 10 || !selectedDate || !selectedTimeSlot || !selectedStaff
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Confirming Booking...
                </span>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
    