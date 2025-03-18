import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppointmentStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/utils";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  MessageSquare, 
  XCircle,
  CheckCircle
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { useState } from "react";

export default function AppointmentsTable() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("today");
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const [appointmentToUpdate, setAppointmentToUpdate] = useState<{id: number, status: AppointmentStatus} | null>(null);

  const todayDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  const { data: allAppointments, isLoading } = useQuery({
    queryKey: ["/api/appointments/doctor"],
    staleTime: 30000, // 30 seconds
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: AppointmentStatus }) => {
      await apiRequest("PUT", `/api/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Appointment updated",
        description: "The appointment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor"] });
      setAppointmentToCancel(null);
      setAppointmentToUpdate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update appointment. ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 border border-neutral-200">
        <div className="h-8 w-64 bg-neutral-100 rounded mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-neutral-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!allAppointments) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 text-center">
        <p className="text-neutral-600">No appointments found.</p>
      </div>
    );
  }

  // Filter appointments based on tab
  const todayAppointments = allAppointments.filter(
    app => app.date === todayDate
  );
  
  const upcomingAppointments = allAppointments.filter(
    app => 
      (app.date > todayDate) && 
      (app.status === AppointmentStatus.CONFIRMED || app.status === AppointmentStatus.PENDING)
  );
  
  const pendingAppointments = allAppointments.filter(
    app => app.status === AppointmentStatus.PENDING
  );
  
  const pastAppointments = allAppointments.filter(
    app => 
      app.date < todayDate || 
      app.status === AppointmentStatus.COMPLETED || 
      app.status === AppointmentStatus.CANCELLED
  );

  const handleCancelAppointment = (id: number) => {
    setAppointmentToCancel(id);
  };

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) {
      updateAppointmentMutation.mutate({
        id: appointmentToCancel,
        status: AppointmentStatus.CANCELLED
      });
    }
  };

  const handleStatusUpdate = (id: number, status: AppointmentStatus) => {
    setAppointmentToUpdate({ id, status });
  };

  const confirmStatusUpdate = () => {
    if (appointmentToUpdate) {
      updateAppointmentMutation.mutate(appointmentToUpdate);
    }
  };

  // Get badge variant based on status
  const getStatusBadge = (status: AppointmentStatus) => {
    const variants = {
      [AppointmentStatus.CONFIRMED]: <Badge variant="success">Confirmed</Badge>,
      [AppointmentStatus.PENDING]: <Badge variant="warning">Pending</Badge>,
      [AppointmentStatus.CANCELLED]: <Badge variant="destructive">Cancelled</Badge>,
      [AppointmentStatus.COMPLETED]: <Badge variant="secondary">Completed</Badge>,
      [AppointmentStatus.CHECKED_IN]: <Badge variant="success">Checked In</Badge>,
    };
    return variants[status] || <Badge>Unknown</Badge>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <Tabs defaultValue="today" onValueChange={setActiveTab}>
        <div className="border-b">
          <TabsList className="h-auto p-0 bg-transparent border-0">
            <TabsTrigger
              value="today"
              className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Today's Appointments
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Pending Approval
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Past Appointments
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="overflow-x-auto">
          <TabsContent value="today" className="m-0">
            <AppointmentList 
              appointments={todayAppointments} 
              onCancel={handleCancelAppointment}
              onStatusUpdate={handleStatusUpdate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="upcoming" className="m-0">
            <AppointmentList 
              appointments={upcomingAppointments} 
              onCancel={handleCancelAppointment}
              onStatusUpdate={handleStatusUpdate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="pending" className="m-0">
            <AppointmentList 
              appointments={pendingAppointments} 
              onCancel={handleCancelAppointment}
              onStatusUpdate={handleStatusUpdate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="past" className="m-0">
            <AppointmentList 
              appointments={pastAppointments} 
              onCancel={handleCancelAppointment}
              onStatusUpdate={handleStatusUpdate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        </div>
      </Tabs>

      <AlertDialog 
        open={appointmentToCancel !== null} 
        onOpenChange={(open) => !open && setAppointmentToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the scheduled appointment and notify the patient.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep appointment</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAppointment}>
              Yes, cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={appointmentToUpdate !== null} 
        onOpenChange={(open) => !open && setAppointmentToUpdate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update appointment status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the appointment status to{" "}
              {appointmentToUpdate?.status === AppointmentStatus.CONFIRMED ? "confirmed" : 
               appointmentToUpdate?.status === AppointmentStatus.CHECKED_IN ? "checked in" :
               appointmentToUpdate?.status === AppointmentStatus.COMPLETED ? "completed" : ""}
              {" "}and notify the patient.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusUpdate}>
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AppointmentListProps {
  appointments: any[];
  onCancel: (id: number) => void;
  onStatusUpdate: (id: number, status: AppointmentStatus) => void;
  getStatusBadge: (status: AppointmentStatus) => JSX.Element;
}

function AppointmentList({ 
  appointments, 
  onCancel,
  onStatusUpdate,
  getStatusBadge 
}: AppointmentListProps) {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="p-6 text-center text-neutral-600">
        No appointments found for this category.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-neutral-50">
          <TableHead>Patient</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id} className="hover:bg-neutral-50">
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="font-medium text-primary">
                    {appointment.patient.firstName[0]}{appointment.patient.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-neutral-800">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </p>
                  {/* Add age/gender here if available */}
                  <p className="text-sm text-neutral-500">Patient</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-neutral-800">{formatDate(appointment.date)}</p>
              <p className="text-neutral-600 text-sm">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="bg-primary-50 text-primary border-primary-100">
                {appointment.reason || "Consultation"}
              </Badge>
            </TableCell>
            <TableCell>
              {getStatusBadge(appointment.status)}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" title="View Details">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Send Message">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                
                {appointment.status === AppointmentStatus.PENDING && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Confirm Appointment"
                    onClick={() => onStatusUpdate(appointment.id, AppointmentStatus.CONFIRMED)}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                )}
                
                {appointment.status === AppointmentStatus.CONFIRMED && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Mark as Checked In"
                    onClick={() => onStatusUpdate(appointment.id, AppointmentStatus.CHECKED_IN)}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                )}
                
                {appointment.status === AppointmentStatus.CHECKED_IN && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Mark as Completed"
                    onClick={() => onStatusUpdate(appointment.id, AppointmentStatus.COMPLETED)}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                )}
                
                {(appointment.status === AppointmentStatus.PENDING || 
                  appointment.status === AppointmentStatus.CONFIRMED) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Cancel Appointment"
                    onClick={() => onCancel(appointment.id)}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
