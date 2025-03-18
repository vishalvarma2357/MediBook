import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  User, 
  Login, 
  PatientRegistration, 
  DoctorRegistration,
  UserRole,
  DoctorStatus
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthUser = User & {
  doctorProfile?: {
    id: number;
    status: DoctorStatus;
  }
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, Login>;
  logoutMutation: UseMutationResult<void, Error, void>;
  patientRegisterMutation: UseMutationResult<AuthUser, Error, PatientRegistration>;
  doctorRegisterMutation: UseMutationResult<
    { user: AuthUser; profile: any }, 
    Error, 
    DoctorRegistration
  >;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AuthUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: Login) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Redirect based on role
      let redirectPath = "/";
      if (user.role === UserRole.DOCTOR) {
        redirectPath = "/doctor";
      } else if (user.role === UserRole.ADMIN) {
        redirectPath = "/admin";
      }
      
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const patientRegisterMutation = useMutation({
    mutationFn: async (data: PatientRegistration) => {
      const res = await apiRequest("POST", "/api/register/patient", data);
      return await res.json();
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const doctorRegisterMutation = useMutation({
    mutationFn: async (data: DoctorRegistration) => {
      const res = await apiRequest("POST", "/api/register/doctor", data);
      return await res.json();
    },
    onSuccess: (data: { user: AuthUser; profile: any }) => {
      queryClient.setQueryData(["/api/user"], data.user);
      window.location.href = "/doctor";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        patientRegisterMutation,
        doctorRegisterMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
