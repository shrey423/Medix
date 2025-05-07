import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Navbar/NavBar.tsx';
import Copyright from '../Copyright/Copyright';
import { BACKEND_URL } from '../services/api.ts';
import './doctor.css';

type PatientData = {
  name: string;
  email: string;
  picture: string | null;
  medicalHistory: string[];
  recentReports: {
    date: string;
    summary: string;
  }[];
};

function PatientDataVisual() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/consultation/doctor');
          return;
        }

        console.log('Fetching patient data...');
        const { data } = await axios.post(
          `${BACKEND_URL}/api/consultation/doctor/patient-data`,
          { token }
        );
        
        console.log('Received patient data:', data);
        if (data.patients) {
          setPatients(data.patients);
        } else {
          console.error('No patients data in response:', data);
          setError('No patient data available');
        }
      } catch (err) {
        console.error('Failed to fetch patient data:', err);
        if (axios.isAxiosError(err)) {
          console.error('Error response:', err.response?.data);
          setError(err.response?.data?.error || 'Failed to load patient data. Please try again later.');
        } else {
          setError('Failed to load patient data. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isDoctor={true} isLogout={true} isPatient={false} />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green"></div>
        </div>
        <Copyright />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isDoctor={true} isLogout={true} isPatient={false} />
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Patient Data Visualization
        </h1>

        {error && (
          <div className="text-center text-red-500 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Patients</h2>
            <div className="space-y-4">
              {patients.map((patient) => (
                <div
                  key={patient.email}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedPatient?.email === patient.email
                      ? 'bg-green text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <img
                      src={patient.picture || '/placeholder-patient.png'}
                      alt={patient.name}
                      className="w-10 h-10 rounded-full mr-3"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-patient.png';
                      }}
                    />
                    <div>
                      <h3 className="font-medium">{patient.name}</h3>
                      <p className="text-sm opacity-75">{patient.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                  <img
                    src={selectedPatient.picture || '/placeholder-patient.png'}
                    alt={selectedPatient.name}
                    className="w-16 h-16 rounded-full mr-4"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-patient.png';
                    }}
                  />
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedPatient.name}</h2>
                    <p className="text-gray-600">{selectedPatient.email}</p>
                  </div>
                </div>

                {/* Medical History */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Medical History</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.medicalHistory.map((condition) => (
                      <span
                        key={condition}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Recent Reports</h3>
                  <div className="space-y-4">
                    {selectedPatient.recentReports.map((report, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(report.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-800">{report.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                Select a patient to view their details
              </div>
            )}
          </div>
        </div>
      </div>
      <Copyright />
    </div>
  );
}

export default PatientDataVisual;
