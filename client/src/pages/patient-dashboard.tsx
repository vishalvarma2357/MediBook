import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import QuickActions from "@/components/dashboard/quick-actions";
import UpcomingAppointments from "@/components/dashboard/upcoming-appointments";
import DoctorList from "@/components/dashboard/doctor-list";
import SpecialtyFilters from "@/components/dashboard/specialty-filters";
import SectionHeading from "@/components/ui/section-heading";
import { Link } from "wouter";
import { useState } from "react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
              Welcome, {user?.firstName}
            </h1>
            <p className="text-neutral-600">
              Manage your appointments and find healthcare professionals
            </p>
          </div>

          <QuickActions />
          <UpcomingAppointments />

          <div>
            <SectionHeading 
              title="Find Doctors" 
              rightContent={
                <Link href="/find-doctors" className="text-primary hover:text-primary-600 font-medium text-sm flex items-center gap-1">
                  View All Specialties
                </Link>
              }
            />

            <SpecialtyFilters
              selected={selectedSpecialty}
              onSelect={setSelectedSpecialty}
            />

            <DoctorList 
              specialization={selectedSpecialty || undefined} 
              limit={3}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
