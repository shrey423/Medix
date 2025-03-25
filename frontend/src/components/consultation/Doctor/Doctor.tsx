import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar/NavBar.tsx';
import FallBackUi from '../Fallback/FallbackUi.js';
import SuccessMessage from '../FlashyMessage/SuccessMessage.js';
import Copyright from '../Copyright/Copyright';
import { BACKEND_URL } from "../services/api.ts";
import DoctorLogin from './DoctorLogin';

function Doctor() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showFlashy, setShowFlashy] = useState(false);

    console.log("Doctor Component Loaded");
    console.log("BACKEND_URL:", BACKEND_URL);
    console.log("DoctorLogin Component:", DoctorLogin);

    useEffect(() => {
        const verifyToken = async () => {
            console.log("Verifying token...");
            const token = localStorage.getItem('token');
            console.log("Token fetched:", token);

            if (token) {
                try {
                    const response = await axios.post(`${BACKEND_URL}/api/auth/verify`, { token });
                    console.log("Verification response:", response.data);

                    if (response.data.role === 'doctor') {
                        setIsAuthenticated(true);
                        console.log("Token valid. Authenticated as doctor.");
                    } else {
                        console.log("Token valid, but not doctor. Redirecting...");
                        navigate('/consultation');
                    }
                } catch (error) {
                    console.error('Token verification failed:', error);
                    localStorage.removeItem('token');
                    console.log("Token removed due to verification failure.");
                }
            } else {
                console.log("No token found in localStorage.");
            }
            setIsLoading(false);
        };

        verifyToken();
    }, [navigate]);

    const handleLoginSuccess = () => {
        console.log("Doctor logged in successfully.");
        setIsAuthenticated(true);
        setShowFlashy(true);
    };

    if (isLoading) {
        console.log("Loading...");
        return <FallBackUi />;
    }

    if (!isAuthenticated) {
        console.log("User not authenticated yet. Showing login page.");
        return (
            <div className="min-h-screen flex flex-col items-center bg-gray-100">
                {/* Uncomment one by one if issues persist */}
                <Navbar isDoctor={false} isLogout={false} isPatient={false}/>
                <DoctorLogin onLoginSuccess={handleLoginSuccess} />
                <h1>Doctor Login Page Loaded</h1>
                {/* <Copyright className="mt-auto" /> */}
            </div>
        );
    }

    console.log("User authenticated. Showing doctor portal.");

    return (
        <div className="doctor-wrapper">
            <Navbar isDoctor={true} isLogout={true} isPatient={false}/>
            {showFlashy && <SuccessMessage message="You're now logged in as a Doctor" />}
            <div className="doctor-portal">
                <h1 className="doctor-portal__title">Doctor Portal</h1>
                <div className="doctor-portal__cards">
                    <Link to="/consultation/doctor/schedule" className="doctor-portal__card">
                        <div className="doctor-portal__card-icon">📅</div>
                        <h2 className="doctor-portal__card-title">Schedule Consultation</h2>
                        <p className="doctor-portal__card-description">
                            Manage your consultation schedule
                        </p>
                    </Link>
                    <Link to="/consultation/doctor_data_visualization" className="doctor-portal__card">
                        <div className="doctor-portal__card-icon">📊</div>
                        <h2 className="doctor-portal__card-title">Patient Data Visualization</h2>
                        <p className="doctor-portal__card-description">
                            View and analyze patient data
                        </p>
                    </Link>
                </div>
            </div>
            <Copyright />
        </div>
    );
}

export default Doctor;
