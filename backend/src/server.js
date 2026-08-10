require('dotenv').config();
const app = require('./app');
const { connectToDatabase, closeDatabaseConnection } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB successfully');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closeDatabaseConnection();
        console.log('Database connection closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

startServer();
