const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGO_URI;

        console.log(`[DATABASE] Attempting to connect to MongoDB...`);
        const conn = await mongoose.connect(MONGODB_URI);

        console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[DATABASE ERROR] Failed to connect to MongoDB: ${error.message}`);
    }
};

module.exports = connectDB;