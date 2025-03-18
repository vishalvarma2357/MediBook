import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DoctorStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useState } from "react";

export default function DoctorApprovalTable() {
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { data: pendingDoctors, isLoading } = useQuery({
    queryKey: ["/api/admin/doctors/pending"],
    staleTime: 30000, // 30 seconds
  });

  const approveDoctorMutation = useMutation({
    mutationFn: async (doctorId: number) => {
      await apiRequest("PUT", `/api/admin/doctors/${doctorId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Doctor approved",
        description: "The doctor has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors/pending"] });
      setApproveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve doctor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const rejectDoctorMutation = useMutation({
    mutationFn: async (doctorId: number) => {
      await apiRequest("PUT", `/api/admin/doctors/${doctorId}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Doctor rejected",
        description: "The doctor application has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors/pending"] });
      setRejectDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject doctor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (doctor: any) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleApprove = (doctor: any) => {
    setSelectedDoctor(doctor);
    setApproveDialogOpen(true);
  };

  const handleReject = (doctor: any) => {
    setSelectedDoctor(doctor);
    setRejectDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedDoctor) {
      approveDoctorMutation.mutate(selectedDoctor.profile.id);
    }
  };

  const confirmReject = () => {
    if (selectedDoctor) {
      rejectDoctorMutation.mutate(selectedDoctor.profile.id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-100 rounded w-64 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!pendingDoctors || pendingDoctors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden p-6 text-center">
        <p className="text-neutral-600">No pending doctor approval requests.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50">
            <TableHead>Doctor</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Experience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingDoctors.map((doctor) => (
            <TableRow key={doctor.id} className="hover:bg-neutral-50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-medium text-primary">
                      {doctor.firstName[0]}{doctor.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">Dr. {doctor.firstName} {doctor.lastName}</p>
                    <p className="text-sm text-neutral-500">{doctor.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-neutral-800">{doctor.profile.specialization}</p>
              </TableCell>
              <TableCell>
                <p className="text-neutral-800">{doctor.profile.experience} years</p>
              </TableCell>
              <TableCell>
                <Badge variant="warning">Pending Approval</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(doctor)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-500 hover:bg-red-50"
                    onClick={() => handleReject(doctor)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View Details"
                    onClick={() => handleViewDetails(doctor)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Doctor Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Doctor Details</DialogTitle>
            <DialogDescription>
              Review the doctor's profile and credentials
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="font-medium text-primary text-xl">
                    {selectedDoctor.firstName[0]}{selectedDoctor.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-xl">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</h3>
                  <p className="text-neutral-600">{selectedDoctor.profile.specialization}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Email</span>
                  <span className="font-medium">{selectedDoctor.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Hospital</span>
                  <span className="font-medium">{selectedDoctor.profile.hospital}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Location</span>
                  <span className="font-medium">{selectedDoctor.profile.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Experience</span>
                  <span className="font-medium">{selectedDoctor.profile.experience} years</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Fee</span>
                  <span className="font-medium">${selectedDoctor.profile.fee} per visit</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-500">Status</span>
                  <Badge variant="warning">Pending Approval</Badge>
                </div>
              </div>

              {selectedDoctor.profile.about && (
                <div>
                  <h4 className="font-medium mb-1">About</h4>
                  <p className="text-neutral-700 text-sm">
                    {selectedDoctor.profile.about}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    setDialogOpen(false);
                    setApproveDialogOpen(true);
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setDialogOpen(false);
                    setRejectDialogOpen(true);
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve {selectedDoctor?.firstName} {selectedDoctor?.lastName} as a doctor.
              They will be able to set availability and receive appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove}>
              Approve Doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject {selectedDoctor?.firstName} {selectedDoctor?.lastName}'s application.
              They will be notified of the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-red-500 hover:bg-red-600">
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
