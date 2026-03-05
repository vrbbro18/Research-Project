require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://iotuser:Iot12345@cluster0.r5gxqyg.mongodb.net/rfidDB';

const drivers = [
  { driverId: 'DRV-001', name: 'Kamal Perera',     phoneNumber: '+94711234567', rating: 52, licenseNumber: 'B1234567', address: 'No. 45, Galle Road, Colombo 03',         licenseClass: 'B', yearsLicensed: 8,  status: 'Flagged'   },
  { driverId: 'DRV-002', name: 'Nimal Silva',       phoneNumber: '+94722345678', rating: 85, licenseNumber: 'B2345678', address: 'No. 12, Kandy Road, Peradeniya',          licenseClass: 'B', yearsLicensed: 12, status: 'Active'    },
  { driverId: 'DRV-003', name: 'Sunil Fernando',    phoneNumber: '+94733456789', rating: 28, licenseNumber: 'C3456789', address: 'No. 78, Negombo Road, Wattala',           licenseClass: 'C', yearsLicensed: 5,  status: 'Suspended' },
  { driverId: 'DRV-004', name: 'Priya Kumari',      phoneNumber: '+94744567890', rating: 94, licenseNumber: 'B4567890', address: 'No. 23, High Level Road, Nugegoda',       licenseClass: 'B', yearsLicensed: 15, status: 'Active'    },
  { driverId: 'DRV-005', name: 'Asanka Bandara',    phoneNumber: '+94755678901', rating: 41, licenseNumber: 'B5678901', address: 'No. 56, Station Road, Gampaha',           licenseClass: 'B', yearsLicensed: 3,  status: 'Flagged'   },
  { driverId: 'DRV-006', name: 'Dilshan Rajapaksa', phoneNumber: '+94766789012', rating: 76, licenseNumber: 'B6789012', address: 'No. 89, Baseline Road, Colombo 09',       licenseClass: 'B', yearsLicensed: 7,  status: 'Active'    },
  { driverId: 'DRV-007', name: 'Chamara Wickrama',  phoneNumber: '+94777890123', rating: 18, licenseNumber: 'C7890123', address: 'No. 34, Marine Drive, Colombo 06',        licenseClass: 'C', yearsLicensed: 10, status: 'Suspended' },
  { driverId: 'DRV-008', name: 'Rangi Herath',      phoneNumber: '+94788901234', rating: 97, licenseNumber: 'B8901234', address: 'No. 67, Temple Road, Kelaniya',           licenseClass: 'B', yearsLicensed: 20, status: 'Active'    },
  { driverId: 'DRV-009', name: 'Tharaka Mendis',    phoneNumber: '+94799012345', rating: 63, licenseNumber: 'B9012345', address: 'No. 11, Lake Road, Biyagama',             licenseClass: 'B', yearsLicensed: 6,  status: 'Active'    },
  { driverId: 'DRV-010', name: 'Saman Jayawardena', phoneNumber: '+94700123456', rating: 37, licenseNumber: 'C0123456', address: 'No. 90, Duplication Road, Colombo 04',    licenseClass: 'C', yearsLicensed: 9,  status: 'Flagged'   },
];

const vehicles = [
  { vehicleNumber: 'CAB-1234', driverId: 'DRV-001', make: 'Toyota',    model: 'Corolla',  year: 2019, color: 'White',  type: 'Sedan',  status: 'Flagged'   },
  { vehicleNumber: 'WP-5678',  driverId: 'DRV-002', make: 'Honda',     model: 'Civic',    year: 2021, color: 'Silver', type: 'Sedan',  status: 'Active'    },
  { vehicleNumber: 'SGK-9012', driverId: 'DRV-003', make: 'Nissan',    model: 'Navara',   year: 2018, color: 'Black',  type: 'Pickup', status: 'Suspended' },
  { vehicleNumber: 'NB-3456',  driverId: 'DRV-004', make: 'Suzuki',    model: 'Swift',    year: 2022, color: 'Blue',   type: 'Sedan',  status: 'Active'    },
  { vehicleNumber: 'PB-7890',  driverId: 'DRV-005', make: 'Mitsubishi',model: 'Pajero',   year: 2017, color: 'Red',    type: 'SUV',    status: 'Flagged'   },
  { vehicleNumber: 'CP-2468',  driverId: 'DRV-006', make: 'Toyota',    model: 'Prius',    year: 2020, color: 'Gray',   type: 'Hybrid', status: 'Active'    },
  { vehicleNumber: 'KN-1357',  driverId: 'DRV-007', make: 'Ford',      model: 'Ranger',   year: 2016, color: 'White',  type: 'Pickup', status: 'Suspended' },
  { vehicleNumber: 'MT-9753',  driverId: 'DRV-008', make: 'Honda',     model: 'Vezel',    year: 2023, color: 'Pearl',  type: 'SUV',    status: 'Active'    },
  { vehicleNumber: 'RT-4680',  driverId: 'DRV-009', make: 'Toyota',    model: 'Aqua',     year: 2020, color: 'Green',  type: 'Hybrid', status: 'Active'    },
  { vehicleNumber: 'UP-8024',  driverId: 'DRV-010', make: 'Isuzu',     model: 'D-Max',    year: 2015, color: 'Blue',   type: 'Pickup', status: 'Flagged'   },
];

// Highway RFID checkpoints (E01 - Southern Expressway, E03 - Outer Circular, E04 - Central Expressway)
const checkpoints = [
  'E01-KM12', 'E01-KM28', 'E01-KM45', 'E01-KM67', 'E01-KM89',
  'E03-KM08', 'E03-KM22', 'E03-KM38',
  'E04-KM05', 'E04-KM19',
];

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

// Generate HIGHWAY-ONLY speed violations
const violations = [];
const vehicleNums = vehicles.map(v => v.vehicleNumber);

// Skewed distribution: most Medium, some High, very few extreme
for (let i = 0; i < 120; i++) {
  const vNum = vehicleNums[Math.floor(Math.random() * vehicleNums.length)];
  const checkpoint = checkpoints[Math.floor(Math.random() * checkpoints.length)];
  
  // Speed distribution for highway: 85-180 km/h
  const rng = Math.random();
  let speed;
  if (rng < 0.25)      speed = Math.round(85 + Math.random() * 14);   // 85-99   → Low (no violation, just log)
  else if (rng < 0.60) speed = Math.round(101 + Math.random() * 18);  // 101-119 → Medium
  else if (rng < 0.88) speed = Math.round(121 + Math.random() * 25);  // 121-146 → High
  else                  speed = Math.round(147 + Math.random() * 33);  // 147-180 → Extreme

  const cat = speed < 100 ? 'Low' : speed <= 120 ? 'Medium' : 'High';

  // Only record as violations if exceeding 100
  if (cat !== 'Low') {
    violations.push({
      vehicleNumber: vNum,
      violationType: 'Speeding',
      speed,
      speedCategory: cat,
      checkpoint,
      timestamp: randomDate(30),
      alertSent: cat === 'High' ? Math.random() > 0.2 : false,
    });
  }
}

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!\n');

    await Driver.deleteMany({});
    await Vehicle.deleteMany({});
    await Violation.deleteMany({});
    console.log('Cleared existing data.');

    await Driver.insertMany(drivers);
    console.log(`✅ Inserted ${drivers.length} drivers`);

    await Vehicle.insertMany(vehicles);
    console.log(`✅ Inserted ${vehicles.length} vehicles`);

    await Violation.insertMany(violations);
    console.log(`✅ Inserted ${violations.length} highway speed violations`);

    console.log('\n🎉 Highway seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
