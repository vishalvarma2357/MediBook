import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppointmentStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/utils";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Stethoscope,
  Brain,
  Filter,
  Search,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function MyAppointments() {
  const { toast } = useToast();
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch appointments
  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ["/api/appointments/patient"],
    staleTime: 60000, // 1 minute
  });

  // Cancel appointment mutation
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

  // Filter appointments based on search query and status
  const filteredAppointments = appointments?.filter(appointment => {
    // Filter by search query
    const doctorName = `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`.toLowerCase();
    const specialization = appointment.doctor.profile.specialization.toLowerCase();
    const hospital = appointment.doctor.profile.hospital.toLowerCase();
    const location = appointment.doctor.profile.location.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = searchQuery === "" || 
      doctorName.includes(searchLower) ||
      specialization.includes(searchLower) ||
      hospital.includes(searchLower) ||
      location.includes(searchLower);
    
    // Filter by status
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    
    // Filter by tab
    if (activeTab === "all") {
      return matchesSearch && matchesStatus;
    } else if (activeTab === "upcoming") {
      return matchesSearch && matchesStatus && 
        (appointment.status === AppointmentStatus.CONFIRMED || 
         appointment.status === AppointmentStatus.PENDING);
    } else if (activeTab === "completed") {
      return matchesSearch && matchesStatus && 
        appointment.status === AppointmentStatus.COMPLETED;
    } else if (activeTab === "cancelled") {
      return matchesSearch && matchesStatus && 
        appointment.status === AppointmentStatus.CANCELLED;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge variant
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
      case AppointmentStatus.CHECKED_IN:
        return "success";
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

  // Prepare today's date in YYYY-MM-DD format for comparison
  const today = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
                My Appointments
              </h1>
              <p className="text-neutral-600">
                View and manage your scheduled medical appointments
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
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
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
                My Appointments
              </h1>
              <p className="text-neutral-600">
                View and manage your scheduled medical appointments
              </p>
            </div>
            
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Appointments</h2>
                <p className="text-neutral-600 mb-4">
                  We encountered an issue while trying to load your appointments. Please try again later.
                </p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient"] })}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
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
              My Appointments
            </h1>
            <p className="text-neutral-600">
              View and manage your scheduled medical appointments
            </p>
          </div>
          
          {/* Filters and search */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input 
                className="pl-10"
                placeholder="Search by doctor name, specialization, hospital..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={AppointmentStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmed</SelectItem>
                    <SelectItem value={AppointmentStatus.CHECKED_IN}>Checked In</SelectItem>
                    <SelectItem value={AppointmentStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={AppointmentStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Appointments</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Appointments list */}
          {filteredAppointments && filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAppointments.map((appointment) => (
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
                      {appointment.reason && (
                        <div className="p-2 bg-neutral-50 rounded-md text-sm text-neutral-700">
                          <strong>Reason:</strong> {appointment.reason}
                        </div>
                      )}
                    </div>
                    
                    {/* Allow cancellation only for upcoming appointments that are not cancelled or completed */}
                    {(appointment.status === AppointmentStatus.CONFIRMED || 
                      appointment.status === AppointmentStatus.PENDING) && 
                     appointment.date >= today && (
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
                    )}
                    
                    {/* For completed or checked-in appointments */}
                    {(appointment.status === AppointmentStatus.COMPLETED || 
                      appointment.status === AppointmentStatus.CHECKED_IN) && (
                      <Button variant="outline" className="w-full">
                        Book Follow-up
                      </Button>
                    )}
                    
                    {/* For cancelled appointments */}
                    {appointment.status === AppointmentStatus.CANCELLED && (
                      <Button variant="secondary" className="w-full">
                        Book New Appointment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">No Appointments Found</h2>
                <p className="text-neutral-600 mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "No appointments match your search criteria. Try adjusting your filters."
                    : "You don't have any appointments yet."}
                </p>
                <Button asChild>
                  <a href="/find-doctors">Book an Appointment</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* Confirmation dialog for cancellation */}
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
