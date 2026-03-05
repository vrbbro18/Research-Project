// Test Script to directly connect to MongoDB without the Express app
const mongoose = require('mongoose');

// The injected parsed string
const MONGODB_URI = "mongodb://ravindulak69_db_user:root@cluster0-shard-00-00.2t0zyr6.mongodb.net:27017,cluster0-shard-00-01.2t0zyr6.mongodb.net:27017,cluster0-shard-00-02.2t0zyr6.mongodb.net:27017/rfidDB?ssl=true&replicaSet=atlas-2t0zyr6-shard-0&authSource=admin&retryWrites=true&w=majority";

async function testConnection() {
    console.log("=== MongoDB Direct Connection Test ===");
    console.log(`Connecting to URL: ${MONGODB_URI.replace(/root/g, '****')}`); // Mask password

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("\n✅ SUCCESS: Connected to MongoDB Cluster! The credentials and IP whitelist are working.");

        // Log some basic info
        const state = mongoose.connection.readyState;
        console.log(`Connection State: ${state} (1 = Connected)`);
        console.log(`Host: ${mongoose.connection.host}`);
        console.log(`Database Name: ${mongoose.connection.name}`);

        process.exit(0);
    } catch (error) {
        console.log("\n❌ FAILED: Could not connect to MongoDB.");
        console.log(`\nError Message:\n${error.message}`);
        process.exit(1);
    }
}

testConnection();
