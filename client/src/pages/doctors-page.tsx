import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import DoctorCard from "@/components/doctors/DoctorCard";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { DoctorWithUser, Specialty } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

export default function DoctorsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  
  // Fetch all doctors
  const { 
    data: doctors, 
    isLoading: isLoadingDoctors 
  } = useQuery<DoctorWithUser[]>({
    queryKey: ["/api/doctors", selectedSpecialty],
    queryFn: async ({ queryKey }) => {
      const specialty = queryKey[1] as string;
      const url = specialty 
        ? `/api/doctors?specialty=${encodeURIComponent(specialty)}` 
        : "/api/doctors";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch doctors");
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch all specialties
  const { 
    data: specialties 
  } = useQuery<Specialty[]>({
    queryKey: ["/api/specialties"],
    enabled: !!user,
  });
  
  // Filter doctors based on search query
  const filteredDoctors = doctors?.filter(doctor => 
    doctor.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Find a Doctor</h1>
        
        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by doctor name or specialty"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Select
                value={selectedSpecialty}
                onValueChange={setSelectedSpecialty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Specialties</SelectItem>
                  {specialties?.map(specialty => (
                    <SelectItem key={specialty.id} value={specialty.name}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Doctors List */}
        <div className="space-y-6">
          {isLoadingDoctors ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDoctors && filteredDoctors.length > 0 ? (
            filteredDoctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-6xl mb-4 text-slate-300">
                <i className="fas fa-user-md"></i>
              </div>
              <h3 className="text-xl font-medium mb-2">No Doctors Found</h3>
              <p className="text-slate-500">
                {searchQuery || selectedSpecialty 
                  ? "Try adjusting your search or filter to find more doctors."
                  : "There are no doctors available at the moment."}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
