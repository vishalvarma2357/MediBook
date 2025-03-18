import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { AppointmentWithDetails } from "@shared/schema";
import { useLocation } from "wouter";

export default function WelcomeSection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch upcoming appointments
  const { data: appointments, isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user && user.role === "patient",
  });

  // Find the next appointment (first confirmed appointment)
  const nextAppointment = appointments?.find(
    (appointment) => appointment.status === "confirmed"
  );

  const handleViewAppointment = () => {
    setLocation("/appointments");
  };

  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-primary to-[#0891b2] rounded-xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Welcome Back, {user?.name?.split(" ")[0]}!</h1>
            {isLoading ? (
              <p className="text-blue-100">Loading your appointments...</p>
            ) : nextAppointment ? (
              <p className="text-blue-100 max-w-xl">
                Your next appointment is on{" "}
                <span className="font-semibold">
                  {nextAppointment.timeSlot.date} at {nextAppointment.timeSlot.startTime}
                </span>{" "}
                with{" "}
                <span className="font-semibold">
                  {nextAppointment.doctor.user.name}
                </span>
                . Remember to bring your medical card.
              </p>
            ) : (
              <p className="text-blue-100 max-w-xl">
                You don't have any upcoming appointments. Book an appointment with one of our specialists today.
              </p>
            )}
            <div className="mt-4">
              <Button
                onClick={handleViewAppointment}
                className="bg-white text-primary px-4 py-2 rounded-lg shadow-sm font-medium hover:bg-blue-50 transition duration-150 ease-in-out text-sm"
              >
                {nextAppointment ? "View Appointment" : "Book Appointment"}
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="128"
              height="128"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/70"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
