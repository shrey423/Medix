const mongoose = require('mongoose');

// Check if the model already exists to prevent model overwrite error
const Report = mongoose.models.Report || mongoose.model('Report', new mongoose.Schema({
  patientEmail: {
    type: String,
    required: true,
    index: true // Add index for better query performance
  },
  summary: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}));

// Add error handling for model creation
Report.on('error', (err) => {
  console.error('Error in Report model:', err);
});

module.exports = Report; 