import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole, DoctorStatus } from "@shared/schema";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: UserRole;
  requireApproved?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole,
  requireApproved = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Role-based check
  if (requiredRole && user.role !== requiredRole && user.role !== UserRole.ADMIN) {
    // Redirect based on role
    let redirectPath = "/";
    
    if (user.role === UserRole.DOCTOR) {
      redirectPath = "/doctor";
    } else if (user.role === UserRole.ADMIN) {
      redirectPath = "/admin";
    }
    
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  // Doctor approval check
  if (
    requireApproved && 
    user.role === UserRole.DOCTOR && 
    user.doctorProfile?.status !== DoctorStatus.APPROVED
  ) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Account Pending Approval</h1>
          <p className="text-neutral-600 text-center max-w-md">
            Your doctor account is currently pending approval by an administrator.
            You will receive access once your credentials have been verified.
          </p>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
