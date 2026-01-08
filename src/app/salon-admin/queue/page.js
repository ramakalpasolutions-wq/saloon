'use client';
import { useState, useEffect } from 'react';
import SalonAdminLayout from '@/components/SalonAdminLayout';
import { useToast } from '@/components/Toast';

export default function QueueManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState('waiting'); // waiting, in-progress, completed, all
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/salon-admin/queue?status=${filter}`);
      const data = await response.json();
      
      if (data.success) {
        setQueue(data.queue || []);
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
      waiting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      'no-show': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusActions = (item) => {
    const actions = {
      waiting: [
        { label: 'Start Service', status: 'in-progress', color: 'bg-blue-600 hover:bg-blue-700' },
        { label: 'No Show', status: 'no-show', color: 'bg-gray-600 hover:bg-gray-700' }
      ],
      'in-progress': [
        { label: 'Complete', status: 'completed', color: 'bg-green-600 hover:bg-green-700' }
      ],
      completed: [],
      cancelled: [],
      'no-show': []
    };
    return actions[item.status] || [];
  };

  if (loading) {
    return (
      <SalonAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </SalonAdminLayout>
    );
  }

  return (
    <SalonAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
            <p className="text-gray-600 mt-2">Manage customer queue and wait times</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Customer
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { value: 'all', label: 'All', emoji: '📋', count: queue.length },
              { value: 'waiting', label: 'Waiting', emoji: '⏳', count: queue.filter(q => q.status === 'waiting').length },
              { value: 'in-progress', label: 'In Progress', emoji: '✂️', count: queue.filter(q => q.status === 'in-progress').length },
              { value: 'completed', label: 'Completed', emoji: '✅', count: queue.filter(q => q.status === 'completed').length }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === tab.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === tab.value ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Queue List */}
        <div className="space-y-4">
          {queue.length > 0 ? (
            queue.map((item, index) => (
              <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Customer Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        #{item.queueNumber}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.customerName}</h3>
                        <p className="text-gray-600">📞 {item.customerPhone}</p>
                        {item.customerEmail && <p className="text-gray-600 text-sm">✉️ {item.customerEmail}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Service</p>
                        <p className="text-gray-900 font-semibold">{item.serviceName || 'Walk-in'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Wait Time</p>
                        <p className="text-gray-900 font-semibold">{item.estimatedWaitTime || 0} min</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Check-in</p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(item.checkInTime).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                          {item.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">📝 {item.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {getStatusActions(item).map(action => (
                      <button
                        key={action.status}
                        onClick={() => updateQueueStatus(item._id, action.status)}
                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${action.color}`}
                      >
                        {action.label}
                      </button>
                    ))}
                    <button
                      onClick={() => deleteQueueItem(item._id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No customers in queue</h3>
              <p className="text-gray-600 mb-6">Add customers to start managing your queue</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Add First Customer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal - Simple version for now */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Customer to Queue</h3>
            <p className="text-gray-600 mb-6">Feature coming soon! Use the public check-in page for now.</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </SalonAdminLayout>
  );
}
