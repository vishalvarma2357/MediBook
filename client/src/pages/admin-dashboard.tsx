import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import AdminStats from "@/components/admin/admin-stats";
import DoctorApprovalTable from "@/components/admin/doctor-approval-table";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@shared/schema";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("doctor-approvals");

  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    staleTime: 60000, // 1 minute
    enabled: activeTab === "users"
  });

  const { data: allAppointments } = useQuery({
    queryKey: ["/api/admin/appointments"],
    staleTime: 60000, // 1 minute
    enabled: activeTab === "appointments"
  });

  // Helper function to get role badge
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge className="bg-purple-500">Admin</Badge>;
      case UserRole.DOCTOR:
        return <Badge className="bg-green-500">Doctor</Badge>;
      case UserRole.PATIENT:
        return <Badge className="bg-blue-500">Patient</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-neutral-600">
              Manage doctors, patients, and system operations
            </p>
          </div>

          <AdminStats />
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-10">
              <div className="border-b overflow-x-auto">
                <TabsList className="h-auto p-0 bg-transparent border-0">
                  <TabsTrigger
                    value="doctor-approvals"
                    className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Doctor Approval Requests
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    All Users
                  </TabsTrigger>
                  <TabsTrigger
                    value="appointments"
                    className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Appointments
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="px-6 py-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    System Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="doctor-approvals" className="m-0">
                <DoctorApprovalTable />
              </TabsContent>
              
              <TabsContent value="users" className="m-0">
                {allUsers ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map(user => (
                        <TableRow key={user.id} className="hover:bg-neutral-50">
                          <TableCell>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            {getRoleBadge(user.role as UserRole)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center text-neutral-500">
                    Loading users...
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="appointments" className="m-0">
                {allAppointments ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50">
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAppointments.map(appointment => (
                        <TableRow key={appointment.id} className="hover:bg-neutral-50">
                          <TableCell>
                            <div className="font-medium">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {appointment.doctor.profile.specialization}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(appointment.date)}</TableCell>
                          <TableCell>
                            {appointment.startTime} - {appointment.endTime}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              appointment.status === 'confirmed' ? 'success' :
                              appointment.status === 'pending' ? 'warning' :
                              appointment.status === 'cancelled' ? 'destructive' :
                              appointment.status === 'completed' ? 'secondary' :
                              'default'
                            }>
                              {appointment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center text-neutral-500">
                    Loading appointments...
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings" className="m-0">
                <div className="p-6 text-center text-neutral-500">
                  System settings not implemented yet.
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
