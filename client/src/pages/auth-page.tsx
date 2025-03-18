import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Stethoscope, UserPlus } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { loginSchema, patientRegistrationSchema, doctorRegistrationSchema } from "@shared/schema";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, patientRegisterMutation, doctorRegisterMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Patient registration form
  const patientRegForm = useForm<z.infer<typeof patientRegistrationSchema>>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "patient",
    },
  });

  // Doctor registration form
  const doctorRegisterForm = useForm({
    resolver: zodResolver(doctorRegistrationSchema),
    defaultValues: {
      user: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        role: "doctor",
      },
      profile: {
        specialization: "",
        hospital: "",
        location: "",
        fee: 100,
        experience: 1,
        about: "",
      }
    },
  });

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  function onPatientRegisterSubmit(values: z.infer<typeof patientRegistrationSchema>) {
    patientRegisterMutation.mutate(values);
  }

  function onDoctorRegisterSubmit(values: any) {
    doctorRegisterMutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      {/* Left column - Forms */}
      <div className="md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">MediBook</CardTitle>
            <CardDescription className="text-center">
              Your Healthcare Booking System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <Tabs defaultValue="patient">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="patient" className="flex items-center gap-1">
                      <UserPlus className="h-4 w-4" /> Patient
                    </TabsTrigger>
                    <TabsTrigger value="doctor" className="flex items-center gap-1">
                      <Stethoscope className="h-4 w-4" /> Doctor
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Patient Registration Form */}
                  <TabsContent value="patient">
                    <Form {...patientRegForm}>
                      <form onSubmit={patientRegForm.handleSubmit(onPatientRegisterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patientRegForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patientRegForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={patientRegForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="johndoe@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={patientRegForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={patientRegForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="********" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={patientRegForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="********" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={patientRegisterMutation.isPending}
                        >
                          {patientRegisterMutation.isPending ? "Registering..." : "Register as Patient"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* Doctor Registration Form */}
                  <TabsContent value="doctor">
                    <Form {...doctorRegisterForm}>
                      <form onSubmit={doctorRegisterForm.handleSubmit(onDoctorRegisterSubmit)} className="space-y-4">
                        <h4 className="font-medium text-neutral-800">Personal Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={doctorRegisterForm.control}
                            name="user.firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={doctorRegisterForm.control}
                            name="user.lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={doctorRegisterForm.control}
                          name="user.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="johndoe@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={doctorRegisterForm.control}
                          name="user.username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={doctorRegisterForm.control}
                            name="user.password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={doctorRegisterForm.control}
                            name="user.confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <h4 className="font-medium text-neutral-800 pt-2">Professional Information</h4>
                        <FormField
                          control={doctorRegisterForm.control}
                          name="profile.specialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specialization</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select specialization" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                                  <SelectItem value="Neurology">Neurology</SelectItem>
                                  <SelectItem value="Dermatology">Dermatology</SelectItem>
                                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                  <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                                  <SelectItem value="Gynecology">Gynecology</SelectItem>
                                  <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                                  <SelectItem value="General Practice">General Practice</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={doctorRegisterForm.control}
                          name="profile.hospital"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hospital/Clinic</FormLabel>
                              <FormControl>
                                <Input placeholder="City Medical Center" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={doctorRegisterForm.control}
                          name="profile.location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="New York, NY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={doctorRegisterForm.control}
                            name="profile.fee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Consultation Fee ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={doctorRegisterForm.control}
                            name="profile.experience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={doctorRegisterMutation.isPending}
                        >
                          {doctorRegisterMutation.isPending ? "Registering..." : "Register as Doctor"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Right column - Hero */}
      <div className="md:w-1/2 bg-primary p-8 flex items-center justify-center hidden md:flex">
        <div className="max-w-md text-white">
          <h1 className="text-3xl font-bold mb-4">Welcome to MediBook</h1>
          <p className="mb-6">
            The easiest way to connect with healthcare professionals and manage your medical appointments.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full mt-1">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Easy Booking</h3>
                <p className="text-white/80">
                  Find and book appointments with top doctors in your area within minutes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full mt-1">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Quality Healthcare</h3>
                <p className="text-white/80">
                  Connect with verified doctors and specialists from leading hospitals.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full mt-1">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Manage Your Health</h3>
                <p className="text-white/80">
                  Keep track of all your appointments and medical records in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
