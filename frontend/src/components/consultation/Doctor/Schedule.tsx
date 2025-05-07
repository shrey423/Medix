import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar/NavBar.tsx';
import Copyright from '../Copyright/Copyright';
import { BACKEND_URL } from '../services/api.ts';
import './doctor.css';

type ConsultationRequest = {
  patientEmail: string;
  patientName: string;
  patientPicture: string | null;
  requestId: string;
  timestamp: string;
};

function Schedule() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ConsultationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [approvingRequest, setApprovingRequest] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/consultation/doctor');
                    return;
                }

                const { data } = await axios.post(
                    `${BACKEND_URL}/api/consultation/doctor-requests`,
                    { token }
                );
                setRequests(data.requests || []);
            } catch (err) {
                console.error('Failed to fetch requests:', err);
                setError('Failed to load consultation requests');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [navigate]);

    const handleApproveRequest = async (requestId: string) => {
        try {
            setApprovingRequest(requestId);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/consultation/doctor');
                return;
            }

            const { data } = await axios.post(
                `${BACKEND_URL}/api/consultation/approve-request/${requestId}`,
                { token }
            );

            if (data.success) {
                // Remove the approved request from the list
                setRequests(prev => prev.filter(req => req.requestId !== requestId));
                // Navigate to the consultation room
                navigate(`/consultation/doctor/schedule/${data.roomId}`);
            }
        } catch (err) {
            console.error('Failed to approve request:', err);
            setError('Failed to approve consultation request');
        } finally {
            setApprovingRequest(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar isDoctor={true} isLogout={true} isPatient={false} />
            <div className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Consultation Requests
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
                ) : requests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.map((request) => (
                            <div key={request.requestId} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-4">
                                    <img
                                        src={request.patientPicture || '/placeholder-patient.png'}
                                        alt={request.patientName}
                                        className="w-12 h-12 rounded-full mr-4"
                                        onError={(e) => {
                                            e.currentTarget.src = '/placeholder-patient.png';
                                        }}
                                    />
                                    <div>
                                        <h3 className="font-semibold text-lg">{request.patientName}</h3>
                                        <p className="text-gray-600 text-sm">{request.patientEmail}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleApproveRequest(request.requestId)}
                                    disabled={approvingRequest === request.requestId}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                        approvingRequest === request.requestId
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green text-white hover:bg-green/90 shadow-md'
                                    }`}
                                >
                                    {approvingRequest === request.requestId ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                            Approving...
                                        </div>
                                    ) : (
                                        'Approve & Start Consultation'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-xl text-gray-600">
                        No pending consultation requests.
                    </div>
                )}
            </div>
            <Copyright />
        </div>
    );
}

export default Schedule;
