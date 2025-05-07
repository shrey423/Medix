import { Suspense, useState } from "react";
import { useLoaderData, Await, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar/NavBar.tsx";
import DoctorCard from "./DoctorCard";
import { BACKEND_URL } from "../services/api.ts";
import Copyright from "../Copyright/Copyright.tsx";
import { useEffect } from "react";

type Doctor = {
  uuid: string;
  name: string;
  email: string;
  picture: string;
};

type PendingRequest = {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  doctorPicture: string;
  timestamp: string;
};

type LoaderData = {
  role: string;
  doctorList: Doctor[];
};

function RequestConsultation() {
  const loaderData = useLoaderData() as { role: Promise<LoaderData> };
  const navigate = useNavigate();
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const requestDoctorLogin = async (id: string) => {
    setIsLoading(true);
    try {
      let token = localStorage.getItem("token");
      if (!token) {
        alert("You need to be logged in to request a consultation");
        navigate("/login");
        return;
      }

      console.log("Requesting doctor login for ID:", id);
      const response = await axios.post(
        `${BACKEND_URL}/api/consultation/request/${id}`,
        { token }
      );

      if (response.data.success) {
        // Add the doctor to pending requests
        const doctor = availableDoctors.find(d => d.uuid === id);
        if (doctor) {
          setPendingRequests(prev => [...prev, {
            doctorId: doctor.uuid,
            doctorName: doctor.name,
            doctorEmail: doctor.email,
            doctorPicture: doctor.picture,
            timestamp: new Date().toISOString()
          }]);
        }
        setAvailableDoctors(prev => prev.filter(doctor => doctor.uuid !== id));
        alert("Consultation request sent successfully!");
      } else {
        console.error("Unexpected response:", response.data);
        alert("There was an issue sending the consultation request. Please try again.");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || "An unknown error occurred";
        console.error("Error in requestDoctorLogin:", errorMessage);
        alert(`Error: ${errorMessage}`);
      } else {
        console.error("Error in requestDoctorLogin:", err);
        alert("An error occurred while sending the consultation request. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pending requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const { data } = await axios.post(`${BACKEND_URL}/api/consultation/pending-requests`, { token });
        setPendingRequests(data.requests || []);
      } catch (err) {
        console.error('Failed to fetch pending requests', err);
      }
    };
    fetchPendingRequests();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <Await resolve={loaderData.role}>
        {(resolvedData: LoaderData) => {
          console.log("Resolved data:", resolvedData);
          const { role, doctorList } = resolvedData;
          
          // Redirect if not patient
          useEffect(() => {
            if (role === "doctor") navigate("/consultation/doctor");
            if (role === "noRole") navigate("/");
          }, [role, navigate]);
          
          // Set doctor list ONCE
          useEffect(() => {
            setAvailableDoctors(doctorList);
          }, [doctorList]);
          
          return (
            <div className="flex flex-col min-h-screen">
              <Navbar isPatient={true} isLogout={true} isDoctor={false} />
              <div className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                  Request Consultation
                </h1>
                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Pending Requests</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingRequests.map((request) => (
                        <div key={request.doctorId} className="bg-white rounded-lg shadow-md p-6">
                          <div className="flex items-center mb-4">
                            <img
                              src={request.doctorPicture || '/placeholder-doctor.png'}
                              alt={request.doctorName}
                              className="w-12 h-12 rounded-full mr-4"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-doctor.png';
                              }}
                            />
                            <div>
                              <h3 className="font-semibold text-lg">{request.doctorName}</h3>
                              <p className="text-gray-600 text-sm">{request.doctorEmail}</p>
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm">
                            Requested on: {new Date(request.timestamp).toLocaleString()}
                          </p>
                          <div className="mt-4">
                            <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                              Pending Approval
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : availableDoctors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableDoctors.map((doctor) => (
                      <DoctorCard
                        key={doctor.uuid}
                        name={doctor.name || `Doctor ${doctor.email}`}
                        picture={doctor.picture}
                        logicMagic={() => requestDoctorLogin(doctor.uuid)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xl text-gray-600">
                    No doctors available for consultation.
                  </div>
                )}
              </div>
              <Copyright />
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}

export default RequestConsultation;