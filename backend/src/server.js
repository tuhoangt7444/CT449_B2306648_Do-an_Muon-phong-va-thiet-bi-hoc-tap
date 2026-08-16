require('dotenv').config(); 
const app = require('./app'); 
// Gọi 2 hàm connectToDatabase và closeDatabaseConnection từ file db.js
const { connectToDatabase, closeDatabaseConnection } = require('./config/db');

const PORT = process.env.PORT || 3000;
// Bắt đầu server và kết nối đến cơ sở dữ liệu MongoDB
async function startServer() {
  try {
    // Kết nối đến cơ sở dữ liệu MongoDB
    await connectToDatabase();
    console.log('Connected to MongoDB successfully');
    // Bắt đầu server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    // Xử lý tín hiệu để tắt server một cách an toàn
    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closeDatabaseConnection();
        console.log('Database connection closed. Exiting process.');
        process.exit(0);
      });
    };
    // Lắng nghe các tín hiệu để tắt server một cách an toàn
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

startServer();
