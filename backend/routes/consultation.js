const express = require("express");
let jwt = require("jsonwebtoken");
let User = require("../database/user");
let PatientRequestDoctor = require("../database/patientRequestDoctor");
let Symptom = require("../models/symptom");
const Report = require("../models/report");
const router = express.Router();
require("dotenv").config();

router.get("/", (req, res) => {
  res.send("Consultation Api running :)");
});

router.post("/getdoctor", async (req, res) => {
  try {
    console.log("Received request for /getdoctor");
    let token = req.body.token;
    let data = jwt.decode(req.body.token);
    console.log("Decoded token data:", data);
    let patientEmail = data.email;
    console.log("Patient email:", patientEmail);
    let requestDoctorData = await PatientRequestDoctor.findOne({
      email: patientEmail,
    });
    console.log("Request doctor data:", requestDoctorData);
    let doctors = await User.find({ role: "doctor" },'uuid email name picture');
    console.log("Number of doctors found:", doctors.length);
    if (requestDoctorData === null) {
      console.log("No existing request data found for patient");
      return res.status(200).json({
        doctors,
      });
    }
    // Filter doctors that have already been requested if needed
    // doctors = doctors.filter((doctor) => {
    //   return !requestDoctorData.requestDoctors.includes(doctor.uuid);
    // });
    console.log("Number of filtered doctors:", doctors.length);
    return res.status(200).json({ doctors });
  } catch (err) {
    console.error("Error in /getdoctor route:", err);
    return res.status(500).json({
      error: "An error occurred while fetching doctors",
      details: err.message,
    });
  }
});

// New endpoint to handle consultation requests
router.post("/request/:doctorId", async (req, res) => {
  try {
    console.log(`Received consultation request for doctor ID: ${req.params.doctorId}`);
    const token = req.body.token;
    
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }
    
    // Decode the token to get patient info
    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.email) {
      return res.status(400).json({ error: "Invalid token" });
    }
    
    const patientEmail = decodedToken.email;
    const doctorId = req.params.doctorId;
    
    // Find the doctor to make sure they exist
    const doctor = await User.findOne({ uuid: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    // Find the patient to make sure they exist
    const patient = await User.findOne({ email: patientEmail, role: "patient" });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    // Check if the patient has already made a request to this doctor
    let patientRequest = await PatientRequestDoctor.findOne({ email: patientEmail });
    
    if (patientRequest) {
      // Initialize requestDoctors if it doesn't exist
      if (!patientRequest.requestDoctors) {
        patientRequest.requestDoctors = [];
      }
      
      // If patient already has request records
      if (patientRequest.requestDoctors.includes(doctorId)) {
        return res.status(400).json({ 
          error: "You have already requested a consultation with this doctor" 
        });
      }
      
      // Add this doctor to the patient's requested doctors list
      patientRequest.requestDoctors.push(doctorId);
      await patientRequest.save();
    } else {
      // Create a new request record for the patient
      patientRequest = new PatientRequestDoctor({
        email: patientEmail,
        requestDoctors: [doctorId]
      });
      await patientRequest.save();
    }
    
    // Here you would also send notification emails to both patient and doctor
    // This is a placeholder for email sending logic
    console.log(`Sending consultation request notification emails for patient: ${patientEmail} and doctor: ${doctor.email}`);
    
    // Return success response
    return res.status(200).json({ 
      message: "All Mails Sent",
      success: true 
    });
    
  } catch (err) {
    console.error("Error in /request/:doctorId route:", err);
    return res.status(500).json({
      error: "An error occurred while processing the consultation request",
      details: err.message
    });
  }
});

// Endpoint to fetch consultation requests for a doctor
router.post("/doctor-requests", async (req, res) => {
  try {
    const token = req.body.token;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.email) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const doctorEmail = decodedToken.email;
    const doctor = await User.findOne({ email: doctorEmail, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Find all patient requests that include this doctor
    const requests = await PatientRequestDoctor.find({
      requestDoctors: doctor.uuid
    });

    // Get patient details for each request
    const requestsWithPatientDetails = await Promise.all(
      requests.map(async (request) => {
        const patient = await User.findOne({ email: request.email, role: "patient" });
        return {
          patientEmail: request.email,
          patientName: patient ? patient.name : "Unknown Patient",
          patientPicture: patient ? patient.picture : null,
          requestId: request._id,
          timestamp: request.createdAt
        };
      })
    );

    return res.status(200).json({ requests: requestsWithPatientDetails });
  } catch (err) {
    console.error("Error in /doctor-requests route:", err);
    return res.status(500).json({
      error: "An error occurred while fetching consultation requests",
      details: err.message
    });
  }
});

// Endpoint to approve a consultation request
router.post("/approve-request/:requestId", async (req, res) => {
    try {
        const token = req.body.token;
        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        const decodedToken = jwt.decode(token);
        if (!decodedToken || !decodedToken.email) {
            return res.status(400).json({ error: "Invalid token" });
        }

        const doctorEmail = decodedToken.email;
        const doctor = await User.findOne({ email: doctorEmail, role: "doctor" });
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const requestId = req.params.requestId;
        const roomId = `room_${requestId}`;

        // Find the request and update its status
        const request = await PatientRequestDoctor.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        // Check if this doctor is in the requestDoctors array
        if (!request.requestDoctors.includes(doctor.uuid)) {
            return res.status(403).json({ error: "You are not authorized to approve this request" });
        }

        // Add or update the approval status
        const approvalIndex = request.approvedRequests.findIndex(
            approval => approval.doctorId === doctor.uuid
        );

        if (approvalIndex === -1) {
            request.approvedRequests.push({
                doctorId: doctor.uuid,
                roomId: roomId,
                status: 'approved',
                timestamp: new Date()
            });
        } else {
            request.approvedRequests[approvalIndex].status = 'approved';
            request.approvedRequests[approvalIndex].roomId = roomId;
            request.approvedRequests[approvalIndex].timestamp = new Date();
        }

        await request.save();

        return res.status(200).json({
            success: true,
            roomId: roomId,
            message: "Consultation request approved successfully"
        });
    } catch (err) {
        console.error("Error in /approve-request route:", err);
        return res.status(500).json({
            error: "An error occurred while approving the consultation request",
            details: err.message
        });
    }
});

// Endpoint to fetch approved consultations for a patient
router.post("/patient-approved-requests", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const patientEmail = decoded.email;

        console.log('Fetching approved requests for patient:', patientEmail);

        const patientRequests = await PatientRequestDoctor.findOne({ email: patientEmail });
        
        if (!patientRequests) {
            console.log('No patient requests found');
            return res.json({ requests: [] });
        }

        const approvedRequests = patientRequests.approvedRequests || [];
        console.log('Found approved requests:', approvedRequests);

        // Get doctor details for each approved request
        const requestsWithDoctorDetails = await Promise.all(
            approvedRequests.map(async (request) => {
                const doctor = await User.findOne({ uuid: request.doctorId });
                return {
                    doctorName: doctor ? doctor.name : 'Unknown Doctor',
                    doctorEmail: doctor ? doctor.email : null,
                    doctorPicture: doctor ? doctor.picture : null,
                    roomId: request.roomId,
                    timestamp: request.timestamp
                };
            })
        );

        console.log('Returning requests with doctor details:', requestsWithDoctorDetails);
        res.json({ requests: requestsWithDoctorDetails });
    } catch (error) {
        console.error('Error in patient-approved-requests:', error);
        res.status(500).json({ message: "Error fetching approved requests" });
    }
});

// Endpoint to save report summary
router.post("/save-report", async (req, res) => {
  try {
    console.log('Received request to save report summary');
    const { token, summary } = req.body;
    if (!token || !summary) {
      console.error('Missing required fields:', { token: !!token, summary: !!summary });
      return res.status(400).json({ error: "Token and summary are required" });
    }

    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.email) {
      console.error('Invalid token:', decodedToken);
      return res.status(400).json({ error: "Invalid token" });
    }

    const patientEmail = decodedToken.email;
    console.log('Saving report for patient:', patientEmail);
    
    const patient = await User.findOne({ email: patientEmail, role: "patient" });
    if (!patient) {
      console.error('Patient not found:', patientEmail);
      return res.status(404).json({ error: "Patient not found" });
    }

    // Create new report
    const report = new Report({
      patientEmail,
      summary,
      timestamp: new Date()
    });
    
    await report.save();
    console.log('Report saved successfully for patient:', patientEmail);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in /save-report route:", err);
    return res.status(500).json({
      error: "An error occurred while saving the report",
      details: err.message
    });
  }
});

// Update the patient data endpoint to include report summaries
router.post("/doctor/patient-data", async (req, res) => {
  try {
    console.log('Received request for patient data');
    const token = req.body.token;
    if (!token) {
      console.error('No token provided');
      return res.status(400).json({ error: "Token is required" });
    }

    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.email) {
      console.error('Invalid token:', decodedToken);
      return res.status(400).json({ error: "Invalid token" });
    }

    const doctorEmail = decodedToken.email;
    console.log('Fetching data for doctor:', doctorEmail);
    
    const doctor = await User.findOne({ email: doctorEmail, role: "doctor" });
    if (!doctor) {
      console.error('Doctor not found:', doctorEmail);
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Find all patients who have requested consultations with this doctor
    const patientRequests = await PatientRequestDoctor.find({
      requestDoctors: doctor.uuid
    });
    console.log('Found patient requests:', patientRequests.length);

    // Get patient details and their medical data
    const patients = await Promise.all(
      patientRequests.map(async (request) => {
        try {
          const patient = await User.findOne({ email: request.email, role: "patient" });
          if (!patient) {
            console.log('Patient not found:', request.email);
            return null;
          }

          // Get patient's medical history from their approved requests
          const medicalHistory = request.approvedRequests
            .filter(req => req.status === 'approved')
            .map(req => req.summary || 'Previous Consultation');

          // Get patient's report summaries
          let reports = [];
          try {
            reports = await Report.find({ patientEmail: patient.email })
              .sort({ timestamp: -1 })
              .limit(5);
            console.log('Found reports for patient:', patient.email, reports.length);
          } catch (reportErr) {
            console.error('Error fetching reports for patient:', patient.email, reportErr);
            reports = [];
          }

          return {
            name: patient.name,
            email: patient.email,
            picture: patient.picture,
            medicalHistory: medicalHistory,
            recentReports: reports.map(report => ({
              date: report.timestamp,
              summary: report.summary
            }))
          };
        } catch (err) {
          console.error('Error processing patient:', request.email, err);
          return null;
        }
      })
    );

    // Filter out null values (patients that no longer exist)
    const validPatients = patients.filter(p => p !== null);
    console.log('Returning valid patients:', validPatients.length);

    return res.status(200).json({ patients: validPatients });
  } catch (err) {
    console.error("Error in /doctor/patient-data route:", err);
    return res.status(500).json({
      error: "An error occurred while fetching patient data",
      details: err.message
    });
  }
});

// Endpoint to save consultation summary
router.post("/save-summary", async (req, res) => {
  try {
    const { token, roomId, summary } = req.body;
    if (!token || !roomId || !summary) {
      return res.status(400).json({ error: "Token, roomId, and summary are required" });
    }

    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.email) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const doctorEmail = decodedToken.email;
    const doctor = await User.findOne({ email: doctorEmail, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Find the patient request with this roomId
    const patientRequest = await PatientRequestDoctor.findOne({
      "approvedRequests.roomId": roomId
    });

    if (!patientRequest) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    // Update the summary for this consultation
    const requestIndex = patientRequest.approvedRequests.findIndex(
      req => req.roomId === roomId && req.doctorId === doctor.uuid
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: "Consultation not found for this doctor" });
    }

    patientRequest.approvedRequests[requestIndex].summary = summary;
    await patientRequest.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in /save-summary route:", err);
    return res.status(500).json({
      error: "An error occurred while saving the consultation summary",
      details: err.message
    });
  }
});

module.exports = router;