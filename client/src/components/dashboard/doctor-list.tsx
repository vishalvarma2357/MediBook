import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Building, MapPin, Coins, Clock } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface DoctorListProps {
  specialization?: string;
  limit?: number;
}

export default function DoctorList({ specialization, limit }: DoctorListProps) {
  const queryEndpoint = specialization
    ? `/api/doctors/specialization/${specialization}`
    : "/api/doctors";

  const { data: doctors, isLoading, error } = useQuery({
    queryKey: [queryEndpoint],
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-40 bg-neutral-100"></div>
            <CardContent className="p-5">
              <div className="flex -mt-10 mb-4">
                <div className="w-16 h-16 rounded-full bg-neutral-200 mr-3 border-4 border-white"></div>
                <div className="mt-6">
                  <div className="h-5 w-32 bg-neutral-200 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-neutral-200 rounded"></div>
                <div className="h-4 w-full bg-neutral-200 rounded"></div>
                <div className="h-4 w-full bg-neutral-200 rounded"></div>
              </div>
              <div className="h-10 w-full bg-neutral-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-neutral-600">
        Error loading doctors. Please try again later.
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="text-center p-4 text-neutral-600">
        No doctors available at the moment.
      </div>
    );
  }

  const displayedDoctors = limit ? doctors.slice(0, limit) : doctors;

  // Office stock images for demo
  const officeImages = [
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    "https://images.unsplash.com/photo-1516549655669-df668a1d40e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80"
  ];

  // Doctor avatar stock images for demo
  const doctorAvatars = [
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayedDoctors.map((doctor, index) => (
        <Card key={doctor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <AspectRatio ratio={16/9} className="bg-neutral-100 relative">
            <img 
              src={officeImages[index % officeImages.length]} 
              alt={`Dr. ${doctor.firstName} ${doctor.lastName}'s office`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
              <div className="flex items-center gap-1 text-primary">
                <Star className="fill-current h-4 w-4" />
                <span className="font-medium">{doctor.profile.rating || "4.9"}</span>
                <span className="text-neutral-400 text-xs">({doctor.profile.reviewCount || "124"})</span>
              </div>
            </div>
          </AspectRatio>
          
          <CardContent className="p-5">
            <div className="flex mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-sm -mt-12 mr-3">
                <img 
                  src={doctorAvatars[index % doctorAvatars.length]} 
                  alt={`Dr. ${doctor.firstName} ${doctor.lastName}`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">Dr. {doctor.firstName} {doctor.lastName}</h3>
                <p className="text-neutral-600 text-sm">{doctor.profile.specialization}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
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
                <span className="text-neutral-800 text-sm">${doctor.profile.fee} per visit</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="success" className="text-xs">Available Today</Badge>
              <Badge variant="secondary" className="text-xs">{doctor.profile.experience}+ years exp</Badge>
            </div>
            
            <Button asChild className="w-full">
              <Link href={`/booking/${doctor.profile.id}`}>Book Appointment</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
