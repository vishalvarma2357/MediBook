import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PatientDashboard from "@/pages/patient-dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AuthPage from "@/pages/auth-page";
import BookingPage from "@/pages/booking-page";
import FindDoctors from "@/pages/find-doctors";
import MyAppointments from "@/pages/my-appointments";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";
import { UserRole } from "@shared/schema";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />

      {/* Role-specific dashboard routes */}
      <ProtectedRoute 
        path="/" 
        requiredRole={UserRole.PATIENT}
        component={PatientDashboard}
      />
      
      <ProtectedRoute 
        path="/doctor"
        requiredRole={UserRole.DOCTOR}
        component={DoctorDashboard}
      />
      
      <ProtectedRoute 
        path="/admin"
        requiredRole={UserRole.ADMIN}
        component={AdminDashboard}
      />

      {/* Patient routes */}
      <ProtectedRoute 
        path="/find-doctors"
        requiredRole={UserRole.PATIENT}
        component={FindDoctors}
      />
      
      <ProtectedRoute 
        path="/my-appointments"
        requiredRole={UserRole.PATIENT}
        component={MyAppointments}
      />
      
      <ProtectedRoute 
        path="/booking/:doctorId"
        requiredRole={UserRole.PATIENT}
        component={BookingPage}
      />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
