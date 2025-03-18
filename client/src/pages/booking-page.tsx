import { useState } from "react";
import { useParams, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import BookingSteps from "@/components/booking/booking-steps";
import DoctorSelection from "@/components/booking/doctor-selection";
import TimeSelection from "@/components/booking/time-selection";
import ConfirmationDetails from "@/components/booking/confirmation-details";
import BookingSuccess from "@/components/booking/booking-success";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function BookingPage() {
  const params = useParams<{ doctorId: string }>();
  const doctorId = parseInt(params.doctorId);
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingDetails, setBookingDetails] = useState({
    doctorId,
    slotId: 0,
    date: "",
    startTime: "",
    endTime: "",
    reason: ""
  });
  
  const [doctorName, setDoctorName] = useState("");
  
  const bookingSteps = [
    { title: "Select Doctor" },
    { title: "Select Time" },
    { title: "Confirm Details" }
  ];

  // Mutation for booking appointment
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      return apiRequest("POST", "/api/appointments", appointmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient"] });
      setCurrentStep(4); // Move to success step
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully scheduled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for continuing to time selection
  const handleContinueToTime = () => {
    setCurrentStep(2);
  };

  // Handler for selecting time slot
  const handleTimeSelected = (slotId: number, date: string, startTime: string, endTime: string) => {
    setBookingDetails(prev => ({
      ...prev,
      slotId,
      date,
      startTime,
      endTime
    }));
    setCurrentStep(3);
  };

  // Handler for confirming appointment
  const handleConfirmAppointment = (reason: string) => {
    bookAppointmentMutation.mutate({
      ...bookingDetails,
      reason
    });
  };

  // Handler for going back
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Save doctor name for success screen
  const saveDoctorName = (name: string) => {
    setDoctorName(name);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="text-primary hover:text-primary-600 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-800 mb-2">Book an Appointment</h1>
                <p className="text-neutral-600">Select your preferred doctor and time slot</p>
              </div>

              {currentStep < 4 && (
                <BookingSteps currentStep={currentStep} steps={bookingSteps} />
              )}

              {currentStep === 1 && (
                <DoctorSelection 
                  doctorId={doctorId} 
                  onContinue={handleContinueToTime} 
                />
              )}

              {currentStep === 2 && (
                <TimeSelection
                  doctorId={doctorId}
                  onContinue={handleTimeSelected}
                  onBack={handleBack}
                />
              )}

              {currentStep === 3 && (
                <ConfirmationDetails
                  doctorId={bookingDetails.doctorId}
                  slotId={bookingDetails.slotId}
                  date={bookingDetails.date}
                  startTime={bookingDetails.startTime}
                  endTime={bookingDetails.endTime}
                  onBack={handleBack}
                  onConfirm={handleConfirmAppointment}
                />
              )}

              {currentStep === 4 && (
                <BookingSuccess
                  doctorName={doctorName}
                  date={bookingDetails.date}
                  startTime={bookingDetails.startTime}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
