'use client';
import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function BulkUploadPage() {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResults(null);
        toast.success(`File "${selectedFile.name}" selected successfully`);
      } else {
        toast.error('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning('Please select a file first');
      return;
    }

    setUploading(true);
    toast.info('Processing Excel file with Google Maps locations...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/salons/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
        toast.success(`Created ${data.results.success} salon(s) successfully with map locations!`);
        if (data.results.failed > 0) {
          toast.warning(`${data.results.failed} salon(s) failed to create`);
        }
        if (data.results.success > 0) {
          setTimeout(() => {
            router.push('/admin/salons');
          }, 3000);
        }
      } else {
        toast.error(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const sampleData = [
      {
        'Salon Name': 'Glamour Salon',
        'Description': 'Premium salon with modern facilities',
        'Phone': '9876543210',
        'Email': 'glamour@example.com',
        'Street': '123 Main Street',
        'City': 'Hyderabad',
        'State': 'Telangana',
        'ZIP': '500001',
        'Google Maps Link': 'https://maps.app.goo.gl/example123',
        'Admin Name': 'John Doe',
        'Admin Email': 'john@glamour.com',
        'Admin Phone': '9876543211',
        'Admin Password': 'admin123',
      },
      {
        'Salon Name': 'Style Studio',
        'Description': 'Modern styling and grooming',
        'Phone': '9876543220',
        'Email': 'style@example.com',
        'Street': '456 Park Avenue',
        'City': 'Mumbai',
        'State': 'Maharashtra',
        'ZIP': '400001',
        'Google Maps Link': 'https://www.google.com/maps/@19.0760,72.8777,15z',
        'Admin Name': 'Jane Smith',
        'Admin Email': 'jane@style.com',
        'Admin Phone': '9876543221',
        'Admin Password': 'admin123',
      },
    ];

    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'salons-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully!');
  };

  return (
    <AdminLayout requiredRole="main-admin">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link href="/admin/salons">
            <button className="text-green-600 hover:text-green-700 mb-3 sm:mb-4 text-sm sm:text-base">
              ← Back to All Salons
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bulk Upload Salons</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Upload an Excel file with Google Maps links to create salons</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">📋 How to Get Google Maps Link</h2>
          <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-blue-800 text-sm sm:text-base">
            <li>Open Google Maps on your phone or computer</li>
            <li>Search for your salon location or long-press on the map</li>
            <li>Click on the location pin or address</li>
            <li>Click the "Share" button</li>
            <li>Click "Copy link" to get the Google Maps link</li>
            <li>Paste this link in the "Google Maps Link" column in Excel</li>
          </ol>
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg border border-blue-300">
            <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">✅ Supported Google Maps Link Formats:</p>
            <ul className="text-xs text-blue-700 space-y-1 font-mono break-all">
              <li>• https://maps.app.goo.gl/xxxxx</li>
              <li>• https://www.google.com/maps/@17.385,78.4867,15z</li>
              <li>• https://www.google.com/maps/place/Name/@17.385,78.4867</li>
              <li>• https://maps.google.com/?q=17.385,78.4867</li>
            </ul>
          </div>
        </div>

        {/* Template Download */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Step 1: Download Template</h2>
          <button
            onClick={downloadTemplate}
            className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span className="text-lg sm:text-xl">📥</span>
            <span>Download Excel Template</span>
          </button>
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
            <p className="font-medium mb-2">Required Columns:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Salon Name * (Required)</li>
              <li>Description</li>
              <li>Phone * (Required)</li>
              <li>Email * (Required, must be unique)</li>
              <li>Street</li>
              <li>City</li>
              <li>State</li>
              <li>ZIP</li>
              <li><strong className="text-green-600">Google Maps Link</strong> * (Required for accurate location)</li>
              <li>Admin Name * (Required)</li>
              <li>Admin Email * (Required, must be unique)</li>
              <li>Admin Phone</li>
              <li>Admin Password * (Required, min 6 characters)</li>
            </ul>
            <div className="mt-3 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-medium text-xs sm:text-sm">
                🗺️ Just paste the Google Maps link - coordinates will be extracted automatically!
              </p>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Step 2: Upload Excel File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-green-500 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📄</div>
              <p className="text-base sm:text-lg font-medium text-gray-900 mb-2 break-all px-2">
                {file ? file.name : 'Click to upload Excel file'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Supports .xlsx, .xls, and .csv files
              </p>
            </label>
          </div>

          {file && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`flex-1 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold text-white transition-colors text-sm sm:text-base ${
                  uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span className="hidden xs:inline">Processing Google Maps Links...</span>
                    <span className="xs:hidden">Processing...</span>
                  </span>
                ) : (
                  '🚀 Upload and Create Salons'
                )}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setResults(null);
                  document.getElementById('file-upload').value = '';
                  toast.info('File selection cleared');
                }}
                disabled={uploading}
                className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Upload Results</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{results.total}</div>
                <div className="text-xs sm:text-sm text-blue-700">Total Rows</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{results.success}</div>
                <div className="text-xs sm:text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 sm:p-4">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{results.failed}</div>
                <div className="text-xs sm:text-sm text-red-700">Failed</div>
              </div>
            </div>

            {/* Successfully Created */}
            {results.created.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-green-900 mb-2 sm:mb-3 text-sm sm:text-base">✅ Successfully Created with Map Locations:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.created.map((item, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
                      <p className="font-medium text-green-900 text-sm sm:text-base break-all">{item.salonName}</p>
                      <p className="text-xs sm:text-sm text-green-700 break-all">Admin: {item.adminEmail}</p>
                      <p className="text-xs text-green-600 break-all">
                        📍 Coordinates: [{item.coordinates[0].toFixed(6)}, {item.coordinates[1].toFixed(6)}]
                        {item.hasMapLink ? ' ✅ From Google Maps' : ' ⚠️ Default Location'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {results.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-900 mb-2 sm:mb-3 text-sm sm:text-base">❌ Errors:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3">
                      <p className="font-medium text-red-900 text-sm sm:text-base break-all">
                        Row {error.row}: {error.salonName}
                      </p>
                      <p className="text-xs sm:text-sm text-red-700 break-all">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {results.success > 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-xs sm:text-sm">
                  ✅ Successfully created {results.success} salon(s) with map locations! Redirecting to all salons page in 3 seconds...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
