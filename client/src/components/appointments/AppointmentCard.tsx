import { AppointmentWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/appointments/${appointment.id}`, {
        status: "cancelled",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel appointment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    cancelMutation.mutate();
    setIsDialogOpen(false);
  };

  let statusBadgeClass = "";
  switch (appointment.status) {
    case "confirmed":
      statusBadgeClass = "bg-green-100 text-green-800";
      break;
    case "pending":
      statusBadgeClass = "bg-yellow-100 text-yellow-800";
      break;
    case "cancelled":
      statusBadgeClass = "bg-red-100 text-red-800";
      break;
    case "completed":
      statusBadgeClass = "bg-blue-100 text-blue-800";
      break;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex flex-shrink-0 items-center justify-center">
            <i className="fas fa-user-md text-primary"></i>
          </div>
          <div>
            <h3 className="font-medium">{appointment.doctor.user.name}</h3>
            <p className="text-sm text-slate-500">{appointment.doctor.specialty}</p>
            <div className="flex items-center mt-2 text-sm">
              <div className="flex items-center mr-4">
                <i className="far fa-calendar-alt text-slate-400 mr-1"></i>
                <span>{appointment.timeSlot.date}</span>
              </div>
              <div className="flex items-center">
                <i className="far fa-clock text-slate-400 mr-1"></i>
                <span>{appointment.timeSlot.startTime}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={`${statusBadgeClass} text-xs px-2 py-1 rounded-full font-medium capitalize`}>
            {appointment.status}
          </span>
        </div>
      </div>
      
      {appointment.status !== "cancelled" && appointment.status !== "completed" && (
        <div className="flex justify-between mt-4 pt-4 border-t border-slate-100">
          <Button variant="ghost" size="sm" className="text-sm text-slate-600 hover:text-slate-800">
            <i className="far fa-calendar-alt mr-1"></i> Reschedule
          </Button>
          <Button variant="ghost" size="sm" className="text-sm text-slate-600 hover:text-slate-800">
            <i className="far fa-eye mr-1"></i> View Details
          </Button>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sm text-red-600 hover:text-red-700">
                <i className="far fa-times-circle mr-1"></i> Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel your appointment with {appointment.doctor.user.name} on {appointment.timeSlot.date} at {appointment.timeSlot.startTime}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, keep appointment</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCancel}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, cancel appointment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
