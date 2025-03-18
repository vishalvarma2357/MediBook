import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  MapPin, 
  Coins, 
  Clock,
  Star 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorSelectionProps {
  doctorId: number;
  onContinue: () => void;
}

export default function DoctorSelection({ doctorId, onContinue }: DoctorSelectionProps) {
  const { data: doctor, isLoading, error } = useQuery({
    queryKey: [`/api/doctors/${doctorId}`],
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Selected Doctor</h3>
        <div className="border border-neutral-200 rounded-xl p-5 bg-neutral-50 animate-pulse">
          <div className="flex items-start gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-36 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full mt-6" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Selected Doctor</h3>
        <div className="border border-red-200 rounded-xl p-5 bg-red-50 text-red-600">
          Error loading doctor information. Please try again later.
        </div>
        <Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Doctor avatar image (mock for demo)
  const avatarImage = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Selected Doctor</h3>
      <div className="border border-primary-100 rounded-xl p-5 bg-primary-50/30">
        <div className="flex items-start gap-4">
          <img 
            src={doctor.profile.profileImageUrl || avatarImage} 
            alt={`Dr. ${doctor.firstName} ${doctor.lastName}`} 
            className="w-20 h-20 rounded-full object-cover border-4 border-white"
          />
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h4 className="font-semibold text-neutral-800 text-lg">Dr. {doctor.firstName} {doctor.lastName}</h4>
                <p className="text-neutral-600">{doctor.profile.specialization}</p>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <Star className="fill-current h-4 w-4" />
                <span className="font-medium">{doctor.profile.rating || "4.8"}</span>
                <span className="text-neutral-400 text-xs">({doctor.profile.reviewCount || "210"})</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Building className="text-neutral-400 h-4 w-4" />
                <span className="text-neutral-800 text-sm">{doctor.profile.hospital}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-neutral-400 h-4 w-4" />
                <span className="text-neutral-800 text-sm">{doctor.profile.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="text-neutral-400 h-4 w-4" />
                <span className="text-neutral-800 text-sm">{formatCurrency(doctor.profile.fee)} per visit</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-neutral-400 h-4 w-4" />
                <span className="text-neutral-800 text-sm">{doctor.profile.experience}+ years experience</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Button className="w-full mt-6" onClick={onContinue}>
        Continue to Select Time
      </Button>
    </div>
  );
}
