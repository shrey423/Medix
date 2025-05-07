import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import Navbar from '../Navbar/NavBar.tsx';
import Copyright from '../Copyright/Copyright';
import './doctor.css';
import { BACKEND_URL } from '../services/api.ts';
import axios from 'axios';

function Room() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [patientName, setPatientName] = useState<string>('');
    const [roomId, setRoomId] = useState<string>('');

    // Handle cleanup when component unmounts or user navigates away
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        const cleanup = () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };

        // Add warning when user tries to leave
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup function
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            cleanup();
        };
    }, [localStream]);

    // Handle back button
    useEffect(() => {
        const handleBackButton = () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            navigate(-1);
        };

        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, [localStream, navigate]);

    useEffect(() => {
        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                alert('Could not access camera and microphone');
            }
        };

        setupCamera();
    }, []);

    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    };

    const endCall = async () => {
        try {
            // Stop all media tracks
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            // Save consultation summary
            const token = localStorage.getItem('token');
            if (token) {
                const summary = `Consultation with ${patientName} on ${new Date().toLocaleString()}`;
                await axios.post(`${BACKEND_URL}/api/consultation/save-summary`, {
                    token,
                    roomId,
                    summary
                });
            }

            // Navigate back
            navigate('/consultation/doctor/schedule');
        } catch (error) {
            console.error('Error ending call:', error);
        }
    };

    useEffect(() => {
        const initializeRoom = async () => {
            if (!id) {
                console.error('Room ID is not provided');
                return;
            }

            // Set room ID
            setRoomId(id);

            // Request media device permissions
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
            } catch (err) {
                console.error('Error accessing media devices.', err);
                alert('Please allow access to your camera and microphone.');
                return;
            }

            const appID = 2009685002;
            const serverSecret = '4583726da0f74064c1c36dbc2babe940';
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                id,
                Date.now().toString(),
                'User'
            );

            const zc = ZegoUIKitPrebuilt.create(kitToken);
            zc.joinRoom({
                container: containerRef.current!,
                sharedLinks: [
                    {
                        name: 'Copy Link',
                        url: `https://app.connect-health.xyz/doctor/schedule/${id}`,
                    },
                ],
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                showScreenSharingButton: false,
                onLeaveRoom: () => navigate('/'),
                onUserJoin: (users) => {
                    if (users && users.length > 0) {
                        const user = users[0];
                        setPatientName(user.userID);
                        // Note: ZegoUIKit doesn't expose stream directly, we'll handle this differently
                    }
                },
            });
        };

        initializeRoom();
    }, [id, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar isDoctor={true} isLogout={true} isPatient={false} />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-4">Consultation Room: {id}</h1>
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={toggleCamera}
                            className={`p-3 rounded-full ${
                                isCameraOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
                            } text-white transition-colors`}
                        >
                            {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                        </button>
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-full ${
                                isMicOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
                            } text-white transition-colors`}
                        >
                            {isMicOn ? 'Mute' : 'Unmute'}
                        </button>
                        <button
                            onClick={endCall}
                            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                            End Call
                        </button>
                    </div>
                </div>
            </div>
            <Copyright />
        </div>
    );
}

export default Room;
