import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface ConfirmationDetailsProps {
  doctorId: number;
  slotId: number;
  date: string;
  startTime: string;
  endTime: string;
  onBack: () => void;
  onConfirm: (reason: string) => void;
}

export default function ConfirmationDetails({
  doctorId,
  slotId,
  date,
  startTime,
  endTime,
  onBack,
  onConfirm
}: ConfirmationDetailsProps) {
  const [reason, setReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Fetch doctor details for confirmation
  const { data: doctor, isLoading } = useQuery({
    queryKey: [`/api/doctors/${doctorId}`],
    staleTime: 60000, // 1 minute
  });

  const handleConfirm = () => {
    onConfirm(reason);
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Confirm Appointment Details</h3>
        
        <div className="border border-neutral-200 rounded-xl p-5 mb-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex justify-between pb-3 border-b border-neutral-100">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-24 w-full mb-6" />
        
        <Skeleton className="h-5 w-64 mb-6" />
        
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Confirm Appointment Details</h3>
        <div className="border border-red-200 rounded-xl p-5 bg-red-50 text-red-600 mb-6">
          Error loading doctor details. Please go back and try again.
        </div>
        <Button onClick={onBack}>Back</Button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Confirm Appointment Details</h3>
      
      <div className="border border-neutral-200 rounded-xl p-5 mb-6">
        <h4 className="font-medium text-neutral-800 mb-4">Appointment Summary</h4>
        <div className="space-y-4">
          <div className="flex justify-between pb-3 border-b border-neutral-100">
            <span className="text-neutral-600">Doctor</span>
            <span className="font-medium text-neutral-800">
              Dr. {doctor.firstName} {doctor.lastName}
            </span>
          </div>
          <div className="flex justify-between pb-3 border-b border-neutral-100">
            <span className="text-neutral-600">Specialization</span>
            <span className="font-medium text-neutral-800">{doctor.profile.specialization}</span>
          </div>
          <div className="flex justify-between pb-3 border-b border-neutral-100">
            <span className="text-neutral-600">Date</span>
            <span className="font-medium text-neutral-800">{formatDate(date)}</span>
          </div>
          <div className="flex justify-between pb-3 border-b border-neutral-100">
            <span className="text-neutral-600">Time</span>
            <span className="font-medium text-neutral-800">
              {formatTime(startTime)} - {formatTime(endTime)}
            </span>
          </div>
          <div className="flex justify-between pb-3 border-b border-neutral-100">
            <span className="text-neutral-600">Location</span>
            <span className="font-medium text-neutral-800">
              {doctor.profile.hospital}, {doctor.profile.location}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Fee</span>
            <span className="font-medium text-neutral-800">
              {formatCurrency(doctor.profile.fee)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-neutral-800 mb-3">Reason for Visit</h4>
        <Textarea
          className="w-full border border-neutral-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={3}
          placeholder="Please describe your symptoms or reason for visit..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-neutral-700">
            I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a>
          </Label>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleConfirm}
          disabled={!termsAccepted}
        >
          Confirm Appointment
        </Button>
      </div>
    </div>
  );
}
