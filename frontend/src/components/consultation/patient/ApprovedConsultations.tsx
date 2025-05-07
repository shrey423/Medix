import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar/NavBar.tsx';
import Copyright from '../Copyright/Copyright';
import { BACKEND_URL } from '../services/api.ts';

type ApprovedConsultation = {
  doctorName: string;
  doctorEmail: string | null;
  doctorPicture: string | null;
  roomId: string;
  timestamp: string;
};

function ApprovedConsultations() {
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState<ApprovedConsultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApprovedConsultations = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/consultation/patient');
                    return;
                }

                const { data } = await axios.post(
                    `${BACKEND_URL}/api/consultation/patient-approved-requests`,
                    { token }
                );
                setConsultations(data.requests || []);
            } catch (err) {
                console.error('Failed to fetch approved consultations:', err);
                setError('Failed to load consultations');
            } finally {
                setIsLoading(false);
            }
        };

        fetchApprovedConsultations();
    }, [navigate]);

    const handleJoinConsultation = (roomId: string) => {
        navigate(`/consultation/patient/schedule/${roomId}`);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar isPatient={true} isLogout={true} isDoctor={false} />
            <div className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Approved Consultations
                </h1>

                {error && (
                    <div className="text-center text-red-500 mb-4">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : consultations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {consultations.map((consultation) => (
                            <div key={consultation.roomId} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-4">
                                    <img
                                        src={consultation.doctorPicture || '/placeholder-doctor.png'}
                                        alt={consultation.doctorName}
                                        className="w-12 h-12 rounded-full mr-4"
                                        onError={(e) => {
                                            e.currentTarget.src = '/placeholder-doctor.png';
                                        }}
                                    />
                                    <div>
                                        <h3 className="font-semibold text-lg">{consultation.doctorName}</h3>
                                        <p className="text-gray-600 text-sm">{consultation.doctorEmail}</p>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm mb-4">
                                    Approved on: {new Date(consultation.timestamp).toLocaleString()}
                                </p>
                                <button
                                    onClick={() => handleJoinConsultation(consultation.roomId)}
                                    className="w-full bg-green text-white py-2 px-4 rounded hover:bg-green/90 transition-colors shadow-md"
                                >
                                    Join Video Call
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-xl text-gray-600">
                        No approved consultations yet.
                    </div>
                )}
            </div>
            <Copyright />
        </div>
    );
}

export default ApprovedConsultations; 