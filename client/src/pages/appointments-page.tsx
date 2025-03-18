import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { AppointmentWithDetails } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Fetch appointments
  const { 
    data: appointments, 
    isLoading 
  } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user,
  });
  
  // Filter appointments based on tab
  const filteredAppointments = appointments?.filter(appointment => {
    if (activeTab === "upcoming") {
      return appointment.status === "confirmed" || appointment.status === "pending";
    } else if (activeTab === "past") {
      return appointment.status === "completed";
    } else if (activeTab === "cancelled") {
      return appointment.status === "cancelled";
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <Button onClick={() => setLocation("/doctors")}>
            Book New Appointment
          </Button>
        </div>
        
        <Tabs 
          defaultValue="upcoming" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAppointments && filteredAppointments.length > 0 ? (
              filteredAppointments.map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="text-6xl mb-4 text-slate-300">
                  <i className="far fa-calendar-check"></i>
                </div>
                <h3 className="text-xl font-medium mb-2">No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Appointments</h3>
                <p className="text-slate-500 mb-4">
                  {activeTab === "upcoming" 
                    ? "You don't have any upcoming appointments. Would you like to book one?"
                    : activeTab === "past"
                    ? "You don't have any past appointments."
                    : "You don't have any cancelled appointments."}
                </p>
                {activeTab === "upcoming" && (
                  <Button onClick={() => setLocation("/doctors")}>
                    Find a Doctor
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
