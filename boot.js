// boot.js
// Load the environment variables
process.loadEnvFile();

// Dynamically import the main application file
import('./app.js')
  .catch((err) => {
    console.error('Error loading app.js:', err);
  });