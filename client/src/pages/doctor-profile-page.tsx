import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DoctorWithUser, TimeSlot } from "@shared/schema";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar, Phone, Mail, MapPin, Clock, Star } from "lucide-react";
import BookingForm from "@/components/doctors/BookingForm";
import DoctorAvailability from "@/components/doctors/DoctorAvailability";
import DoctorReviews from "@/components/doctors/DoctorReviews";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const [location] = useLocation();
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Check if the URL contains a query parameter to open the booking form
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    if (searchParams.get('book') === 'true') {
      setShowBookingForm(true);
    }
  }, [location]);

  // Fetch doctor details
  const { data: doctor, isLoading: isLoadingDoctor } = useQuery<DoctorWithUser>({
    queryKey: [`/api/doctors/${params.id}`],
    enabled: !!params.id && !!user,
  });

  // Fetch doctor available time slots
  const { data: timeSlots, isLoading: isLoadingTimeSlots } = useQuery<TimeSlot[]>({
    queryKey: [`/api/doctors/${params.id}/timeslots`, { available: true }],
    queryFn: async ({ queryKey }) => {
      const doctorId = (queryKey[0] as string).split('/')[3];
      const res = await fetch(`/api/doctors/${doctorId}/timeslots?available=true`);
      if (!res.ok) throw new Error("Failed to fetch time slots");
      return res.json();
    },
    enabled: !!params.id && !!user,
  });

  const toggleBookingForm = () => {
    setShowBookingForm(!showBookingForm);
  };

  if (isLoadingDoctor) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4 text-slate-300">
              <i className="fas fa-user-md"></i>
            </div>
            <h3 className="text-xl font-medium mb-2">Doctor Not Found</h3>
            <p className="text-slate-500 mb-4">
              The doctor you're looking for doesn't exist or may have been removed.
            </p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Doctor Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary to-[#0891b2] h-32 relative">
            {showBookingForm && (
              <Button 
                onClick={toggleBookingForm}
                variant="outline" 
                className="absolute top-4 right-4 bg-white"
              >
                <i className="fas fa-times mr-2"></i>
                Close Booking
              </Button>
            )}
          </div>
          
          <div className="px-6 pb-6 pt-16 relative">
            <div className="absolute -top-16 left-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                <AvatarImage src={doctor.user.imageUrl || ""} alt={doctor.user.name} />
                <AvatarFallback className="text-4xl bg-primary-100 text-primary">
                  {doctor.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">{doctor.user.name}</h1>
                <p className="text-primary font-medium">{doctor.specialty}</p>
                
                <div className="flex items-center mt-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.floor(doctor.rating || 0) 
                            ? "text-yellow-400 fill-yellow-400" 
                            : star - 0.5 <= doctor.rating 
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-yellow-400"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-slate-600">
                      {doctor.rating?.toFixed(1) || "0.0"} ({doctor.numberOfReviews || 0} reviews)
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-600 max-w-2xl mb-4">{doctor.bio || "No bio information available."}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {doctor.user.phone && (
                    <div className="flex items-center text-slate-600">
                      <Phone className="h-4 w-4 mr-2 text-primary/70" />
                      <span>{doctor.user.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-slate-600">
                    <Mail className="h-4 w-4 mr-2 text-primary/70" />
                    <span>{doctor.user.email}</span>
                  </div>
                  
                  {doctor.user.address && (
                    <div className="flex items-center text-slate-600">
                      <MapPin className="h-4 w-4 mr-2 text-primary/70" />
                      <span>{doctor.user.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-slate-600">
                    <Clock className="h-4 w-4 mr-2 text-primary/70" />
                    <span>{doctor.experience || 0} years of experience</span>
                  </div>
                </div>
              </div>
              
              {!showBookingForm && user?.role === 'patient' && (
                <div className="mt-6 md:mt-0">
                  <Button 
                    onClick={toggleBookingForm}
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {showBookingForm ? (
          <BookingForm 
            doctor={doctor} 
            timeSlots={timeSlots || []} 
            isLoading={isLoadingTimeSlots}
            onCancel={toggleBookingForm}
          />
        ) : (
          <Tabs defaultValue="availability" className="space-y-4">
            <TabsList className="w-full justify-start border-b rounded-none p-0">
              <TabsTrigger 
                value="availability" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Availability
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="availability" className="pt-4">
              <DoctorAvailability 
                doctorId={doctor.id} 
                timeSlots={timeSlots || []} 
                isLoading={isLoadingTimeSlots}
                onBookAppointment={toggleBookingForm}
              />
            </TabsContent>
            
            <TabsContent value="reviews" className="pt-4">
              <DoctorReviews doctorId={doctor.id} rating={doctor.rating || 0} reviewCount={doctor.numberOfReviews || 0} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
}
