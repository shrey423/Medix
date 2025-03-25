const express = require("express");
let jwt = require("jsonwebtoken");
let User = require("../database/user");
let PatientRequestDoctor = require("../database/patientRequestDoctor");

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

    // doctors = doctors.filter((doctor) => {
    //   return !requestDoctorData.reqeustDoctors.includes(doctor.uuid);
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


module.exports = router;