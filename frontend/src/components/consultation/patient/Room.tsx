import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import Navbar from '../Navbar/NavBar.tsx';
import Copyright from '../Copyright/Copyright';

// Add type definitions for ZegoUIKit
declare module '@zegocloud/zego-uikit-prebuilt' {
    export function generateKitTokenForTest(
        appID: number,
        serverSecret: string,
        roomID: string,
        userID: string,
        userName: string
    ): string;

    export function create(kitToken: string): {
        joinRoom: (config: {
            container: HTMLElement;
            scenario: {
                mode: number;
            };
            showScreenSharingButton: boolean;
            showLeavingView: boolean;
            showUserList: boolean;
            onLeaveRoom: () => void;
            onUserJoin: (users: Array<{ userID: string }>) => void;
        }) => void;
    };

    export const OneONoneCall: number;
}

const Room = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const containerRef = useRef<HTMLDivElement>(null);

    const endCall = () => {
        navigate('/consultation/patient');
    };

    useEffect(() => {
        const initializeRoom = async () => {
            if (!id) {
                console.error('Room ID is not provided');
                return;
            }

            try {
                const appID = parseInt(import.meta.env.VITE_ZEG_APP_ID);
                const serverSecret = import.meta.env.VITE_ZEG_SERVER_SECRET;
                
                if (!appID || !serverSecret) {
                    console.error('Missing Zego credentials');
                    return;
                }

                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appID,
                    serverSecret,
                    id,
                    Date.now().toString(),
                    'Patient'
                );

                const zc = ZegoUIKitPrebuilt.create(kitToken);
                zc.joinRoom({
                    container: containerRef.current!,
                    scenario: {
                        mode: ZegoUIKitPrebuilt.OneONoneCall,
                    },
                    showScreenSharingButton: false,
                    showLeavingView: false,
                    showUserList: false,
                    onLeaveRoom: () => {
                        endCall();
                    },
                    onUserJoin: (users) => {
                        if (users && users.length > 0) {
                            console.log('Doctor joined:', users[0].userID);
                        }
                    },
                });
            } catch (err) {
                console.error('Error initializing room:', err);
                alert('Failed to initialize video call. Please try again.');
            }
        };

        initializeRoom();
    }, [id, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar isDoctor={false} isLogout={true} isPatient={true} />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-4">Consultation Room: {id}</h1>
                    <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4" />
                </div>
            </div>
            <Copyright />
        </div>
    );
};

export default Room; 