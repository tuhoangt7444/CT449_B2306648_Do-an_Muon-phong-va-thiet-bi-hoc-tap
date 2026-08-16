const { MongoClient } = require('mongodb');

let client = null;
let db = null;
// Hàm kết nối đến cơ sở dữ liệu MongoDB
async function connectToDatabase() {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DATABASE || 'studyhub_ctu';
// Tạo một client mới và kết nối đến MongoDB
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}
// Hàm lấy đối tượng cơ sở dữ liệu đã kết nối
function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
}
// Hàm đóng kết nối đến cơ sở dữ liệu MongoDB
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
