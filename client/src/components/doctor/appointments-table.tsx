import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AppointmentStatus, 
  User,
  Appointment as AppointmentType
} from "@shared/schema";
import { formatDate, formatTime } from "@/lib/utils";
import { 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  User as UserIcon
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AppointmentWithPatient extends AppointmentType {
  patient: User;
}

export default function AppointmentsTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AppointmentStatus | "all">("all");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Fetch doctor appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments/doctor", activeTab !== "all" ? activeTab : undefined],
    queryFn: async () => {
      const endpoint = activeTab !== "all" 
        ? `/api/appointments/doctor?status=${activeTab}`
        : "/api/appointments/doctor";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
    enabled: !!user?.doctorProfile?.id,
  });

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: AppointmentStatus }) => {
      return apiRequest("PUT", `/api/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The appointment status has been updated successfully.",
      });
      setCompleteDialogOpen(false);
      setCancelDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/doctor"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update appointment status",
        variant: "destructive",
      });
    },
  });

  // Filter appointments based on active tab
  const filteredAppointments = appointments || [];

  // Get appointment badge variant based on status
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>;
      case AppointmentStatus.PENDING:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case AppointmentStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case AppointmentStatus.COMPLETED:
        return <Badge variant="secondary">Completed</Badge>;
      case AppointmentStatus.CHECKED_IN:
        return <Badge variant="default">Checked In</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Handle view appointment details
  const handleViewDetails = (appointment: AppointmentWithPatient) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  // Handle complete appointment
  const handleCompleteAppointment = (appointment: AppointmentWithPatient) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(false);
    setCompleteDialogOpen(true);
  };

  // Handle cancel appointment
  const handleCancelAppointment = (appointment: AppointmentWithPatient) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(false);
    setCancelDialogOpen(true);
  };

  // Confirm complete appointment
  const confirmCompleteAppointment = () => {
    if (selectedAppointment) {
      updateStatusMutation.mutate({
        id: selectedAppointment.id,
        status: AppointmentStatus.COMPLETED,
      });
    }
  };

  // Confirm cancel appointment
  const confirmCancelAppointment = () => {
    if (selectedAppointment) {
      updateStatusMutation.mutate({
        id: selectedAppointment.id,
        status: AppointmentStatus.CANCELLED,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
          <CardDescription>Manage your patient appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-100 rounded w-64 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-neutral-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Appointments</CardTitle>
        <CardDescription>Manage your patient appointments</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={value => setActiveTab(value as AppointmentStatus | "all")}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={AppointmentStatus.PENDING}>Pending</TabsTrigger>
            <TabsTrigger value={AppointmentStatus.CONFIRMED}>Confirmed</TabsTrigger>
            <TabsTrigger value={AppointmentStatus.COMPLETED}>Completed</TabsTrigger>
            <TabsTrigger value={AppointmentStatus.CANCELLED}>Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredAppointments.length === 0 ? (
              <div className="bg-neutral-50 rounded-lg p-6 text-center">
                <p className="text-neutral-600">No appointments found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment: AppointmentWithPatient) => (
                    <TableRow key={appointment.id} className="hover:bg-neutral-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-neutral-500" />
                          </div>
                          <div>
                            <div className="font-medium">{appointment.patient.firstName} {appointment.patient.lastName}</div>
                            <div className="text-xs text-neutral-500">{appointment.patient.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-neutral-500" />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-neutral-500" />
                          <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(appointment.status as AppointmentStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetails(appointment)}
                          >
                            View
                          </Button>
                          {appointment.status === AppointmentStatus.CONFIRMED && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleCompleteAppointment(appointment)}
                            >
                              Complete
                            </Button>
                          )}
                          {(appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.CONFIRMED) && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleCancelAppointment(appointment)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View the details of this appointment
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-neutral-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}</h3>
                  <p className="text-neutral-600">{selectedAppointment.patient.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Date</span>
                  <span className="font-medium">{formatDate(selectedAppointment.date)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Time</span>
                  <span className="font-medium">{formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Status</span>
                  {getStatusBadge(selectedAppointment.status as AppointmentStatus)}
                </div>
                <div className="py-2">
                  <span className="text-neutral-500 block mb-1">Reason for Visit</span>
                  <div className="font-medium bg-neutral-50 p-3 rounded-md">
                    {selectedAppointment.reason || "No reason provided"}
                  </div>
                </div>
              </div>

              <DialogFooter>
                {selectedAppointment.status === AppointmentStatus.CONFIRMED && (
                  <Button 
                    className="flex items-center gap-1" 
                    onClick={() => handleCompleteAppointment(selectedAppointment)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as Completed
                  </Button>
                )}
                
                {(selectedAppointment.status === AppointmentStatus.PENDING || selectedAppointment.status === AppointmentStatus.CONFIRMED) && (
                  <Button 
                    variant="destructive" 
                    className="flex items-center gap-1"
                    onClick={() => handleCancelAppointment(selectedAppointment)}
                  >
                    <XCircle className="h-4 w-4" /> Cancel Appointment
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Appointment Dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the appointment as completed. 
              Please confirm that the appointment has been fulfilled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCompleteAppointment}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Completed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Appointment Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the appointment. The patient will be notified.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancelAppointment}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}