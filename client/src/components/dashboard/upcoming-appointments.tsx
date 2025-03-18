import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Stethoscope,
  Brain,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppointmentStatus } from "@shared/schema";
import SectionHeading from "@/components/ui/section-heading";
import { formatDate, formatTime } from "@/lib/utils";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UpcomingAppointments() {
  const { toast } = useToast();
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ["/api/appointments/patient"],
    staleTime: 60000, // 1 minute
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      await apiRequest(
        "PUT", 
        `/api/appointments/${appointmentId}/status`, 
        { status: AppointmentStatus.CANCELLED }
      );
    },
    onSuccess: () => {
      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient"] });
      setAppointmentToCancel(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel appointment. ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter only upcoming (confirmed or pending) appointments
  const upcomingAppointments = appointments?.filter(
    (appointment) => 
      appointment.status === AppointmentStatus.CONFIRMED || 
      appointment.status === AppointmentStatus.PENDING
  ).slice(0, 3);

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return "success";
      case AppointmentStatus.PENDING:
        return "warning";
      case AppointmentStatus.CANCELLED:
        return "destructive";
      case AppointmentStatus.COMPLETED:
        return "secondary";
      default:
        return "default";
    }
  };

  const handleCancelAppointment = (appointmentId: number) => {
    setAppointmentToCancel(appointmentId);
  };

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) {
      cancelMutation.mutate(appointmentToCancel);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-10">
        <SectionHeading 
          title="Upcoming Appointments" 
          rightContent={
            <Link href="/my-appointments" className="text-primary hover:text-primary-600 font-medium text-sm flex items-center gap-1">
              View All
            </Link>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-24 bg-neutral-100 rounded mb-4"></div>
                <div className="space-y-3 mb-4">
                  <div className="h-4 bg-neutral-100 rounded"></div>
                  <div className="h-4 bg-neutral-100 rounded"></div>
                  <div className="h-4 bg-neutral-100 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 bg-neutral-100 rounded flex-1"></div>
                  <div className="h-10 bg-neutral-100 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10">
        <SectionHeading title="Upcoming Appointments" />
        <Card>
          <CardContent className="p-5 text-center text-neutral-600">
            Error loading appointments. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!upcomingAppointments || upcomingAppointments.length === 0) {
    return (
      <div className="mb-10">
        <SectionHeading title="Upcoming Appointments" />
        <Card>
          <CardContent className="p-5 text-center text-neutral-600">
            You don't have any upcoming appointments.
            <div className="mt-4">
              <Button asChild>
                <Link href="/find-doctors">Book an Appointment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <SectionHeading 
        title="Upcoming Appointments" 
        rightContent={
          <Link href="/my-appointments" className="text-primary hover:text-primary-600 font-medium text-sm flex items-center gap-1">
            View All
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingAppointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    {appointment.doctor.profile.specialization.includes("Neuro") ? (
                      <Brain className="text-primary h-6 w-6" />
                    ) : (
                      <Stethoscope className="text-primary h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-800">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</h4>
                    <p className="text-neutral-600 text-sm">{appointment.doctor.profile.specialization}</p>
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(appointment.status as AppointmentStatus)}>
                  {appointment.status}
                </Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-neutral-400 h-4 w-4" />
                  <span className="text-neutral-800 text-sm">{formatDate(appointment.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-neutral-400 h-4 w-4" />
                  <span className="text-neutral-800 text-sm">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-neutral-400 h-4 w-4" />
                  <span className="text-neutral-800 text-sm">{appointment.doctor.profile.hospital}, {appointment.doctor.profile.location}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Reschedule
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={() => handleCancelAppointment(appointment.id)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={appointmentToCancel !== null} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will cancel your scheduled appointment and notify the doctor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAppointment}>
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
