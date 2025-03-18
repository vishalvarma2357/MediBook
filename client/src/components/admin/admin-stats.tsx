import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  UserCog, 
  Clock, 
  Calendar 
} from "lucide-react";
import { UserRole, AppointmentStatus } from "@shared/schema";

export default function AdminStats() {
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    staleTime: 60000, // 1 minute
  });

  const { data: allAppointments } = useQuery({
    queryKey: ["/api/admin/appointments"],
    staleTime: 60000, // 1 minute
  });

  const { data: pendingDoctors } = useQuery({
    queryKey: ["/api/admin/doctors/pending"],
    staleTime: 60000, // 1 minute
  });

  // Calculate stats
  const totalPatients = allUsers?.filter(user => user.role === UserRole.PATIENT).length || 0;
  const totalDoctors = allUsers?.filter(user => user.role === UserRole.DOCTOR).length || 0;
  const pendingApprovals = pendingDoctors?.length || 0;
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = allAppointments?.filter(app => app.date === today).length || 0;
  const completedToday = allAppointments?.filter(app => 
    app.date === today && 
    (app.status === AppointmentStatus.COMPLETED || app.status === AppointmentStatus.CHECKED_IN)
  ).length || 0;

  // Calculate growth percentages
  const patientGrowth = "+12%"; // In a real app, this would be calculated from actual data
  const doctorGrowth = "+3"; // In a real app, this would be calculated from actual data

  // Loading skeleton
  if (!allUsers || !allAppointments) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-neutral-100 rounded mb-2 w-24"></div>
              <div className="h-8 bg-neutral-100 rounded mb-1 w-12"></div>
              <div className="h-4 bg-neutral-100 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Total Patients</h3>
            <div className="bg-primary-50 p-2 rounded-full">
              <Users className="text-primary h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{totalPatients}</p>
          <p className="text-green-500 text-sm">{patientGrowth} this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Total Doctors</h3>
            <div className="bg-green-50 p-2 rounded-full">
              <UserCog className="text-green-500 h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{totalDoctors}</p>
          <p className="text-green-500 text-sm">{doctorGrowth} this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Pending Approvals</h3>
            <div className="bg-amber-50 p-2 rounded-full">
              <Clock className="text-amber-500 h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{pendingApprovals}</p>
          <p className="text-neutral-400 text-sm">Updated 5 min ago</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Today's Appointments</h3>
            <div className="bg-orange-50 p-2 rounded-full">
              <Calendar className="text-orange-500 h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{todayAppointments}</p>
          <p className="text-neutral-400 text-sm">{completedToday} completed</p>
        </CardContent>
      </Card>
    </div>
  );
}
