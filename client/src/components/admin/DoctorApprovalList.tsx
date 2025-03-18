import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DoctorApprovalList() {
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: number, name: string } | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  
  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Filter doctors
  const doctors = users?.filter(user => user.role === "doctor") || [];
  
  // Pending approval doctors
  const pendingDoctors = doctors.filter(doctor => !doctor.approved);
  
  // Approved doctors
  const approvedDoctors = doctors.filter(doctor => doctor.approved);
  
  // Approve doctor mutation
  const approveMutation = useMutation({
    mutationFn: async (doctorId: number) => {
      await apiRequest("PATCH", `/api/admin/doctors/${doctorId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Doctor Approved",
        description: "The doctor has been approved successfully."
      });
      setSelectedDoctor(null);
      setActionType(null);
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject doctor mutation
  const rejectMutation = useMutation({
    mutationFn: async (doctorId: number) => {
      await apiRequest("PATCH", `/api/admin/doctors/${doctorId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Doctor Rejected",
        description: "The doctor has been rejected successfully."
      });
      setSelectedDoctor(null);
      setActionType(null);
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleApprove = (doctorId: number, doctorName: string) => {
    setSelectedDoctor({ id: doctorId, name: doctorName });
    setActionType("approve");
  };
  
  const handleReject = (doctorId: number, doctorName: string) => {
    setSelectedDoctor({ id: doctorId, name: doctorName });
    setActionType("reject");
  };
  
  const confirmAction = () => {
    if (!selectedDoctor) return;
    
    if (actionType === "approve") {
      approveMutation.mutate(selectedDoctor.id);
    } else if (actionType === "reject") {
      rejectMutation.mutate(selectedDoctor.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Doctor Approvals</CardTitle>
          <CardDescription>
            Review and approve doctor registration requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDoctors.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 text-slate-300">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
              <p className="text-slate-500">
                There are no doctors waiting for approval at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDoctors.map(doctor => (
                <div 
                  key={doctor.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center mb-4 md:mb-0">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarImage src={doctor.imageUrl || ""} alt={doctor.name} />
                      <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-sm text-slate-500">{doctor.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleReject(doctor.id, doctor.name)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(doctor.id, doctor.name)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Approved Doctors</CardTitle>
          <CardDescription>
            List of all approved doctors in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvedDoctors.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 text-slate-300">
                <i className="fas fa-user-md"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No Approved Doctors</h3>
              <p className="text-slate-500">
                There are no approved doctors in the system yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedDoctors.map(doctor => (
                <div 
                  key={doctor.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center mb-4 md:mb-0">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarImage src={doctor.imageUrl || ""} alt={doctor.name} />
                      <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-sm text-slate-500">{doctor.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Approved
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedDoctor && !!actionType} onOpenChange={() => {
        setSelectedDoctor(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Doctor" : "Reject Doctor"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? `Are you sure you want to approve ${selectedDoctor?.name}? This will allow them to use the system.`
                : `Are you sure you want to reject ${selectedDoctor?.name}? They will not be able to use the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
