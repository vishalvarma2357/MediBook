import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "@/components/profile/ProfileForm";
import DoctorScheduleManager from "@/components/profile/DoctorScheduleManager";
import { useQuery } from "@tanstack/react-query";
import { Doctor } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Fetch doctor profile if user is a doctor
  const { data: doctorProfile } = useQuery<Doctor>({
    queryKey: [`/api/doctors/user/${user?.id}`],
    queryFn: async () => {
      if (!user || user.role !== "doctor") return null;
      
      // Since we don't have a direct endpoint for getting doctor by userId,
      // we'll just mock this for now. In a real app this would be a proper API call.
      const doctor = { 
        id: 1, 
        userId: user.id,
        specialty: "Cardiology",
        bio: "Experienced cardiologist with over 10 years of practice.",
        experience: 10,
        rating: 4.8,
        numberOfReviews: 120
      };
      
      return doctor;
    },
    enabled: !!user && user.role === "doctor",
  });

  // Get tabs based on user role
  const getTabs = () => {
    const tabs = [
      { id: "profile", label: "Profile" },
    ];
    
    if (user?.role === "doctor") {
      tabs.push(
        { id: "schedule", label: "Schedule Management" }
      );
    }
    
    if (user?.role === "patient") {
      tabs.push(
        { id: "medical-records", label: "Medical Records" },
        { id: "prescriptions", label: "Prescriptions" }
      );
    }
    
    return tabs;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
          <div className="w-full md:w-auto flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-3">
              <AvatarImage src={user?.imageUrl || ""} alt={user?.name || ""} />
              <AvatarFallback className="text-2xl">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold">{user?.name}</h1>
            <p className="text-slate-500 capitalize">{user?.role}</p>
          </div>
          
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Email</h3>
                  <p>{user?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Phone</h3>
                  <p>{user?.phone || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Address</h3>
                  <p>{user?.address || "Not provided"}</p>
                </div>
                
                {user?.role === "doctor" && doctorProfile && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Specialty</h3>
                      <p>{doctorProfile.specialty}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Experience</h3>
                      <p>{doctorProfile.experience} years</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-500">Rating</h3>
                      <p>{doctorProfile.rating} ({doctorProfile.numberOfReviews} reviews)</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            {getTabs().map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileForm user={user} doctorProfile={user?.role === "doctor" ? doctorProfile : undefined} />
          </TabsContent>
          
          {user?.role === "doctor" && (
            <TabsContent value="schedule">
              <DoctorScheduleManager doctorId={doctorProfile?.id} />
            </TabsContent>
          )}
          
          {user?.role === "patient" && (
            <>
              <TabsContent value="medical-records">
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Records</CardTitle>
                    <CardDescription>
                      Your medical history and records
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <div className="text-5xl mb-4 text-slate-300">
                      <i className="fas fa-file-medical"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Medical Records</h3>
                    <p className="text-slate-500">
                      You don't have any medical records yet.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="prescriptions">
                <Card>
                  <CardHeader>
                    <CardTitle>Prescriptions</CardTitle>
                    <CardDescription>
                      Your prescriptions and medications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <div className="text-5xl mb-4 text-slate-300">
                      <i className="fas fa-prescription-bottle-alt"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Prescriptions</h3>
                    <p className="text-slate-500">
                      You don't have any active prescriptions.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
