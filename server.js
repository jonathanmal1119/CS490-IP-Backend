const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 4001;

// Test database connection and start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('ailed to connect to database.');
      process.exit(1);
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
