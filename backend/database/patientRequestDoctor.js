let mongoose = require("mongoose");
let Schema = new mongoose.Schema({
  email: String,
  requestDoctors: [String],
  approvedRequests: [{
    doctorId: String,
    roomId: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    summary: {
      type: String,
      default: 'Consultation completed'
    }
  }]
});
let PatientRequestDoctor = mongoose.model("PatientRequestDoctor", Schema);
module.exports = PatientRequestDoctor;
