import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import QuickStats from "@/components/doctor/quick-stats";
import AppointmentsTable from "@/components/doctor/appointments-table";
import AvailabilityCalendar from "@/components/doctor/availability-calendar";
import { DoctorStatus } from "@shared/schema";
import { ClipboardCheck, AlertCircle } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  
  // Check if doctor is approved
  const isDoctorApproved = user?.doctorProfile?.status === DoctorStatus.APPROVED;

  // Pending approval view
  if (!isDoctorApproved) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">
              Your account is pending approval
            </h1>
            <p className="text-neutral-600 mb-6">
              Thank you for registering as a doctor. An administrator will review your credentials shortly.
              You'll be notified once your account is approved.
            </p>
            <p className="text-sm text-neutral-500">
              If you have any questions, please contact support.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
              Welcome, Dr. {user?.lastName}
            </h1>
            <p className="text-neutral-600">
              Manage your appointments and availability
            </p>
          </div>

          <QuickStats />
          
          <div className="mb-10">
            <AppointmentsTable />
          </div>
          
          <AvailabilityCalendar />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
