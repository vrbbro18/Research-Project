// The base cluster URL snippet from the provided screenshot
const REPLICA_SET_NAME = 'atlas-xxxx-shard-0';  // Can usually be omitted if we just connect straight to the primary, or we can use standard Atlas replica set naming conventions
const DB_NAME = 'rfidDB';
const USER = 'iotuser';
const PASS = 'Iot12345';

// For MongoDB Atlas clusters (tier M0/free), they usually follow this format for the 3 nodes:
// cluster0-shard-00-00.r5gxqyg.mongodb.net:27017
// cluster0-shard-00-01.r5gxqyg.mongodb.net:27017
// cluster0-shard-00-02.r5gxqyg.mongodb.net:27017

const uri = `mongodb://${USER}:${PASS}@cluster0-shard-00-00.r5gxqyg.mongodb.net:27017,cluster0-shard-00-01.r5gxqyg.mongodb.net:27017,cluster0-shard-00-02.r5gxqyg.mongodb.net:27017/${DB_NAME}?ssl=true&replicaSet=atlas-r5gxqyg-shard-0&authSource=admin&retryWrites=true&w=majority`;

console.log("Constructed URI:\n" + uri);

// Output to .env directly for testing
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the MONGO_URI line
envContent = envContent.replace(/MONGO_URI=.*/, `MONGO_URI=${uri}`);
fs.writeFileSync(envPath, envContent);

console.log("Updated .env file with the manually constructed string.");
