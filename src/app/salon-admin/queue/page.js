'use client';
import { useState, useEffect } from 'react';
import SalonAdminLayout from '@/components/SalonAdminLayout';
import { useToast } from '@/components/Toast';

export default function QueueManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [allQueue, setAllQueue] = useState([]); // ✅ NEW - Store all queue items for counts
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/salon-admin/queue?status=${filter}`);
      const data = await response.json();
      
      if (data.success) {
        setQueue(data.queue || []);
        
        // ✅ NEW - Fetch all queue items for accurate counts
        if (filter !== 'all') {
          const allResponse = await fetch(`/api/salon-admin/queue?status=all`);
          const allData = await allResponse.json();
          if (allData.success) {
            setAllQueue(allData.queue || []);
          }
        } else {
          setAllQueue(data.queue || []);
        }
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const updateQueueStatus = async (queueId, newStatus) => {
    try {
      const response = await fetch('/api/salon-admin/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchQueue();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteQueueItem = async (queueId) => {
    if (!confirm('Are you sure you want to remove this customer from queue?')) return;

    try {
      const response = await fetch(`/api/salon-admin/queue?id=${queueId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Customer removed from queue');
        fetchQueue();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      waiting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      'no-show': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusActions = (item) => {
    const actions = {
      confirmed: [
        { label: 'Move to Waiting', status: 'waiting', color: 'bg-yellow-600 hover:bg-yellow-700' },
        { label: 'Start Service', status: 'in-progress', color: 'bg-blue-600 hover:bg-blue-700' }
      ],
      waiting: [
        { label: 'Start Service', status: 'in-progress', color: 'bg-blue-600 hover:bg-blue-700' },
        { label: 'No Show', status: 'no-show', color: 'bg-gray-600 hover:bg-gray-700' }
      ],
      'in-progress': [
        { label: 'Complete', status: 'completed', color: 'bg-emerald-600 hover:bg-emerald-700' }
      ],
      completed: [],
      cancelled: [],
      'no-show': []
    };
    return actions[item.status] || [];
  };

  const getStatusEmoji = (status) => {
    const emojis = {
      confirmed: '✅',
      waiting: '⏳',
      'in-progress': '✂️',
      completed: '🎉',
      cancelled: '❌',
      'no-show': '👻'
    };
    return emojis[status] || '📋';
  };

  // ✅ FIXED - Calculate counts from allQueue instead of filtered queue
  const getStatusCount = (status) => {
    if (status === 'all') return allQueue.length;
    return allQueue.filter(q => q.status === status).length;
  };

  if (loading) {
    return (
      <SalonAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
        </div>
      </SalonAdminLayout>
    );
  }

  return (
    <SalonAdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Queue Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage customer queue and wait times</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span className="text-lg sm:text-xl">+</span>
            Add Customer
          </button>
        </div>

        {/* Filter Tabs - ✅ FIXED COUNTS */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { value: 'all', label: 'All', emoji: '📋' },
              { value: 'confirmed', label: 'Confirmed', emoji: '✅' },
              { value: 'waiting', label: 'Waiting', emoji: '⏳' },
              { value: 'in-progress', label: 'In Progress', emoji: '✂️' },
              { value: 'completed', label: 'Completed', emoji: '🎉' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-xs sm:text-sm ${
                  filter === tab.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.emoji}</span>
                <span className="hidden xs:inline">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === tab.value ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {getStatusCount(tab.value)} {/* ✅ FIXED - Use getStatusCount */}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Queue List */}
        <div className="space-y-3 sm:space-y-4">
          {queue.length > 0 ? (
            queue.map((item, index) => (
              <div key={item._id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0 shadow-lg">
                        #{item.queueNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{item.customerName}</h3>
                          <span className="text-xl">{getStatusEmoji(item.status)}</span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600">📞 {item.customerPhone}</p>
                        {item.customerEmail && <p className="text-xs sm:text-sm text-gray-600">✉️ {item.customerEmail}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Service</p>
                        <p className="text-gray-900 font-semibold truncate">
                          {item.services && item.services.length > 0 
                            ? item.services.map(s => s.name).join(', ')
                            : item.serviceName || 'Walk-in'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Wait Time</p>
                        <p className="text-gray-900 font-semibold">{item.estimatedWaitTime || 0} min</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Check-in</p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(item.checkInTime).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Status</p>
                        <span className={`inline-block px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                          {item.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {item.appointmentDate && (
                      <div className="mt-2 text-xs sm:text-sm text-gray-600">
                        📅 Appointment: {new Date(item.appointmentDate).toLocaleDateString('en-IN')}
                      </div>
                    )}

                    {item.notes && (
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-700 break-words">📝 {item.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 flex-wrap lg:flex-nowrap">
                    {getStatusActions(item).map(action => (
                      <button
                        key={action.status}
                        onClick={() => updateQueueStatus(item._id, action.status)}
                        className={`flex-1 lg:flex-none px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-white font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${action.color}`}
                      >
                        {action.label}
                      </button>
                    ))}
                    <button
                      onClick={() => deleteQueueItem(item._id)}
                      className="flex-1 lg:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-xs sm:text-sm whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-6xl mb-4">🎯</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No customers in queue</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {filter !== 'all' 
                  ? `No ${filter} bookings found` 
                  : 'Add customers to start managing your queue'
                }
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm sm:text-base"
              >
                Add First Customer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Add Customer to Queue</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Feature coming soon! Use the public check-in page for now.</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </SalonAdminLayout>
  );
}
