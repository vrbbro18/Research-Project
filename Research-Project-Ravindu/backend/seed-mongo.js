require('dotenv').config();
const mongoose = require('mongoose');
const Accident = require('./models/Accident');
const accidentsData = require('./data/accidents');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        await Accident.deleteMany({});
        console.log("Cleared existing accidents.");

        const dataToInsert = accidentsData.map(a => ({
            ...a,
            imagePath: '/uploads/dummy.png',
            originalFilename: 'dummy.png',
            alertSent: true
        }));

        await Accident.insertMany(dataToInsert);
        console.log(`Successfully seeded ${dataToInsert.length} dummy accident records.`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seed();
