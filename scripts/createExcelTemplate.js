const XLSX = require('xlsx');
const path = require('path');

// Sample data
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
    'Admin Name': 'Jane Smith',
    'Admin Email': 'jane@style.com',
    'Admin Phone': '9876543221',
    'Admin Password': 'admin123',
  },
  {
    'Salon Name': 'Beauty Lounge',
    'Description': 'Luxury beauty treatments',
    'Phone': '9876543230',
    'Email': 'beauty@example.com',
    'Street': '789 Royal Road',
    'City': 'Bangalore',
    'State': 'Karnataka',
    'ZIP': '560001',
    'Admin Name': 'Mike Johnson',
    'Admin Email': 'mike@beauty.com',
    'Admin Phone': '9876543231',
    'Admin Password': 'admin123',
  },
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Salons');

// Save to file
const filePath = path.join(__dirname, '..', 'salons-data.xlsx');
XLSX.writeFile(wb, filePath);

console.log('✅ Excel template created successfully!');
console.log(`📁 File location: ${filePath}`);
console.log('\n📝 You can now edit this file and add more salons.');
console.log('   Make sure to keep the column headers as they are.');
