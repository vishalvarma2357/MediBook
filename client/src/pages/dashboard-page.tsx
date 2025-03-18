import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import DashboardTab from "@/components/dashboard/DashboardTab";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import DoctorCard from "@/components/doctors/DoctorCard";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { Button } from "@/components/ui/button";
import { AppointmentWithDetails, DoctorWithUser } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user,
  });
  
  // Fetch doctors
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<DoctorWithUser[]>({
    queryKey: ["/api/doctors"],
    enabled: !!user,
  });
  
  // Filter upcoming appointments
  const upcomingAppointments = appointments?.filter(
    (appointment) => appointment.status === "confirmed" || appointment.status === "pending"
  ).slice(0, 2);
  
  // Filter popular doctors (just take the first 4 for now)
  const popularDoctors = doctors?.slice(0, 4);
  
  const quickAccessOptions = [
    {
      icon: "fas fa-calendar-plus",
      title: "Book Appointment",
      link: "/doctors",
    },
    {
      icon: "fas fa-user-md",
      title: "Find Doctor",
      link: "/doctors",
    },
    {
      icon: "fas fa-notes-medical",
      title: "Medical Records",
      link: "/profile",
    },
    {
      icon: "fas fa-pills",
      title: "Prescriptions",
      link: "/profile",
    },
  ];
  
  const tabs = [
    { title: "Dashboard", path: "/" },
    { title: "Find Doctors", path: "/doctors" },
    { title: "My Appointments", path: "/appointments" },
    { title: "Medical Records", path: "/profile" },
    { title: "Prescriptions", path: "/profile" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        <DashboardTab tabs={tabs} />
        
        <WelcomeSection />
        
        {/* Quick Access Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccessOptions.map((option) => (
              <QuickAccessCard
                key={option.title}
                icon={option.icon}
                title={option.title}
                link={option.link}
              />
            ))}
          </div>
        </section>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments Section */}
          <section className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
              <Button
                variant="link"
                className="text-primary text-sm font-medium"
                onClick={() => setLocation("/appointments")}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {isLoadingAppointments ? (
                <div className="text-center py-8 text-gray-500">Loading appointments...</div>
              ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                  <div className="text-5xl mb-4">
                    <i className="far fa-calendar-alt text-slate-300"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Upcoming Appointments</h3>
                  <p className="text-slate-500 mb-4">
                    You don't have any appointments scheduled. Book an appointment with one of our specialists.
                  </p>
                  <Button onClick={() => setLocation("/doctors")}>
                    Find a Doctor
                  </Button>
                </div>
              )}
            </div>
          </section>
          
          {/* Popular Doctors Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Popular Doctors</h2>
              <Button
                variant="link"
                className="text-primary text-sm font-medium"
                onClick={() => setLocation("/doctors")}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {isLoadingDoctors ? (
                <div className="text-center py-8 text-gray-500">Loading doctors...</div>
              ) : popularDoctors && popularDoctors.length > 0 ? (
                popularDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} compact />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                  <div className="text-5xl mb-4">
                    <i className="fas fa-user-md text-slate-300"></i>
                  </div>
                  <h3 className="text-lg font-medium">No Doctors Available</h3>
                  <p className="text-slate-500">
                    There are no doctors available at the moment.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
