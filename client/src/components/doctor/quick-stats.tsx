import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserRound, 
  Clock, 
  CalendarCheck, 
  Calendar 
} from "lucide-react";

export default function QuickStats() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments/doctor"],
    staleTime: 30000, // 30 seconds
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate stats if appointments data is available
  const stats = appointments ? calculateStats(appointments, today) : null;

  // Loading state
  if (isLoading || !stats) {
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
            <h3 className="font-semibold text-neutral-600">Today's Patients</h3>
            <div className="bg-primary-50 p-2 rounded-full">
              <UserRound className="text-primary text-xl h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{stats.today.total}</p>
          <p className="text-neutral-400 text-sm">{stats.today.remaining} remaining</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Pending Approvals</h3>
            <div className="bg-amber-50 p-2 rounded-full">
              <Clock className="text-amber-500 text-xl h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{stats.pending}</p>
          <p className="text-neutral-400 text-sm">Updated recently</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Total This Week</h3>
            <div className="bg-green-50 p-2 rounded-full">
              <CalendarCheck className="text-green-500 text-xl h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{stats.thisWeek}</p>
          <p className="text-neutral-400 text-sm">{stats.weekComparison}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Available Slots</h3>
            <div className="bg-orange-50 p-2 rounded-full">
              <Calendar className="text-orange-500 text-xl h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-800">{stats.availableSlots}</p>
          <p className="text-neutral-400 text-sm">Next 7 days</p>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateStats(appointments: any[], today: string) {
  // Filter today's appointments
  const todayAppointments = appointments.filter(app => app.date === today);
  const completedToday = todayAppointments.filter(app => 
    app.status === 'completed' || app.status === 'checked_in'
  ).length;
  
  // Pending approvals
  const pendingApprovals = appointments.filter(app => app.status === 'pending').length;
  
  // This week's appointments (current date to 7 days in the future)
  const currentDate = new Date(today);
  const nextWeekDate = new Date(currentDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  
  const thisWeekAppointments = appointments.filter(app => {
    const appDate = new Date(app.date);
    return appDate >= currentDate && appDate <= nextWeekDate;
  }).length;
  
  // Previous week's appointments (for comparison)
  const lastWeekStart = new Date(currentDate);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const lastWeekEnd = new Date(currentDate);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  
  const lastWeekAppointments = appointments.filter(app => {
    const appDate = new Date(app.date);
    return appDate >= lastWeekStart && appDate <= lastWeekEnd;
  }).length;
  
  // Comparison text
  const diff = thisWeekAppointments - lastWeekAppointments;
  const weekComparison = diff >= 0 
    ? `+${diff} from last week` 
    : `${diff} from last week`;
  
  // Available slots calculation (mock - in real app would come from a separate API call)
  const availableSlots = 15; // Placeholder
  
  return {
    today: {
      total: todayAppointments.length,
      completed: completedToday,
      remaining: todayAppointments.length - completedToday
    },
    pending: pendingApprovals,
    thisWeek: thisWeekAppointments,
    lastWeek: lastWeekAppointments,
    weekComparison,
    availableSlots
  };
}
