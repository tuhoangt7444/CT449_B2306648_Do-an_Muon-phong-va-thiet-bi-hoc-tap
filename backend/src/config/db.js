const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectToDatabase() {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DATABASE || 'studyhub_ctu';

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
}

async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeDatabaseConnection
};
