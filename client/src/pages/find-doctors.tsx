import { useState } from "react";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import DoctorList from "@/components/dashboard/doctor-list";
import SpecialtyFilters from "@/components/dashboard/specialty-filters";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function FindDoctors() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get all doctors
  const { data: allDoctors, isLoading } = useQuery({
    queryKey: ["/api/doctors"],
    staleTime: 60000, // 1 minute
  });
  
  // Filter doctors based on search query and specialty
  const filteredDoctors = allDoctors ? allDoctors.filter(doctor => {
    const matchesSearch = searchQuery === "" || 
      `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doctor.profile.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.profile.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.profile.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === null || 
      doctor.profile.specialization === selectedSpecialty;
    
    return matchesSearch && matchesSpecialty;
  }) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
              Find Doctors
            </h1>
            <p className="text-neutral-600">
              Browse through our list of qualified healthcare professionals
            </p>
          </div>

          {/* Search and filter section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input 
                  className="pl-10"
                  placeholder="Search by name, specialization, or location" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedSpecialty(null);
              }}>
                Clear Filters
              </Button>
            </div>

            <SpecialtyFilters
              selected={selectedSpecialty}
              onSelect={setSelectedSpecialty}
            />
          </div>

          {/* Results section */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-800">
                {isLoading ? 'Loading doctors...' : 
                 `${filteredDoctors.length} Doctors Found`}
              </h2>
              {selectedSpecialty && (
                <p className="text-neutral-600">Filtered by: {selectedSpecialty}</p>
              )}
            </div>

            <DoctorList specialization={selectedSpecialty || undefined} />

            {filteredDoctors && filteredDoctors.length === 0 && !isLoading && (
              <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No doctors found</h3>
                <p className="text-neutral-600">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
