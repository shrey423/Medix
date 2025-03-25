import { Suspense, useState, useEffect } from "react";
import { useLoaderData, Await, useNavigate } from "react-router-dom";

import Navbar from "../Navbar/NavBar.tsx";
import DoctorCard from "./DoctorCard";

import Copyright from "../Copyright/Copyright";

type Doctor = {
  uuid: string;
  name: string;
  email: string;
  picture: string;
};

type LoaderData = {
  role: string;
  doctorList: Doctor[];
};

function RequestConsultation() {
  const loaderData = useLoaderData() as { role: Promise<LoaderData> };
  const navigate = useNavigate();
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);

  const requestDoctorLogin = async () => {
   
      alert("working on this right now");
  };

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

                {availableDoctors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableDoctors.map((doctor) => (
                      <DoctorCard
                        key={doctor.uuid}
                        name={doctor.name || `Doctor ${doctor.email}`}
                        picture={doctor.picture}
                        logicMagic={() => requestDoctorLogin()}
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
