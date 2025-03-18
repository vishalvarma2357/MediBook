import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { patientRegisterSchema, loginSchema, doctorRegisterSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { Specialty } from "@shared/schema";

export default function AuthPage() {
  const { user, loginMutation, patientRegisterMutation, doctorRegisterMutation } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [accountType, setAccountType] = useState<"patient" | "doctor">("patient");

  // Get redirect path from URL if it exists
  const redirectPath = new URLSearchParams(location.split("?")[1]).get("redirect") || "/";

  // Fetch specialties for doctor registration
  const { data: specialties } = useQuery<Specialty[]>({
    queryKey: ["/api/specialties"],
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Patient registration form
  const patientRegisterForm = useForm<z.infer<typeof patientRegisterSchema>>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "patient",
    },
  });

  // Doctor registration form
  const doctorRegisterForm = useForm<z.infer<typeof doctorRegisterSchema>>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      user: {
        name: "",
        email: "",
        password: "",
        role: "doctor",
      },
      doctor: {
        specialty: "",
        bio: "",
        experience: 0,
      },
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onPatientRegisterSubmit = (data: z.infer<typeof patientRegisterSchema>) => {
    patientRegisterMutation.mutate(data);
  };

  const onDoctorRegisterSubmit = (data: z.infer<typeof doctorRegisterSchema>) => {
    doctorRegisterMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex flex-col justify-center p-8 md:p-12 w-full md:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center mb-6">
            <i className="fas fa-heartbeat text-primary text-2xl mr-2"></i>
            <h1 className="text-2xl font-bold text-primary">MediBook</h1>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Enter your credentials to access your account
                  </p>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              {...field} 
                              autoComplete="email"
                            />
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
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label
                          htmlFor="remember"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Select your account type and fill in your details
                  </p>
                </div>
                
                <div className="flex mb-6">
                  <Button
                    type="button"
                    variant={accountType === "patient" ? "default" : "outline"}
                    className="flex-1 rounded-r-none"
                    onClick={() => setAccountType("patient")}
                  >
                    <i className="fas fa-user mr-2"></i>
                    Patient
                  </Button>
                  <Button
                    type="button"
                    variant={accountType === "doctor" ? "default" : "outline"}
                    className="flex-1 rounded-l-none"
                    onClick={() => setAccountType("doctor")}
                  >
                    <i className="fas fa-user-md mr-2"></i>
                    Doctor
                  </Button>
                </div>
                
                {accountType === "patient" ? (
                  <Form {...patientRegisterForm}>
                    <form onSubmit={patientRegisterForm.handleSubmit(onPatientRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={patientRegisterForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={patientRegisterForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                {...field} 
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={patientRegisterForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={patientRegisterForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm your password" 
                                {...field} 
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" required />
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the{" "}
                          <a href="#" className="text-primary hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-primary hover:underline">
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={patientRegisterMutation.isPending}
                      >
                        {patientRegisterMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...doctorRegisterForm}>
                    <form onSubmit={doctorRegisterForm.handleSubmit(onDoctorRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={doctorRegisterForm.control}
                        name="user.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={doctorRegisterForm.control}
                        name="user.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                {...field} 
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={doctorRegisterForm.control}
                        name="doctor.specialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialty</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your specialty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {specialties?.map((specialty) => (
                                  <SelectItem key={specialty.id} value={specialty.name}>
                                    {specialty.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={doctorRegisterForm.control}
                        name="doctor.bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your experience and expertise" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={doctorRegisterForm.control}
                        name="doctor.experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Years of experience" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={doctorRegisterForm.control}
                        name="user.password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={doctorRegisterForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm your password" 
                                {...field} 
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="doctor-terms" required />
                        <label
                          htmlFor="doctor-terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the{" "}
                          <a href="#" className="text-primary hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-primary hover:underline">
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={doctorRegisterMutation.isPending}
                      >
                        {doctorRegisterMutation.isPending ? "Creating Account..." : "Create Doctor Account"}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-primary to-[#0891b2]">
        <div className="h-full flex flex-col justify-center px-12 py-12 text-white">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold mb-6">Your Health, Our Priority</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2 flex-shrink-0 text-blue-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Find and book appointments with top healthcare providers</span>
              </li>
              <li className="flex items-start">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2 flex-shrink-0 text-blue-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Access your medical records and history in one place</span>
              </li>
              <li className="flex items-start">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2 flex-shrink-0 text-blue-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Manage appointments and receive timely reminders</span>
              </li>
              <li className="flex items-start">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2 flex-shrink-0 text-blue-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Join our growing network of trusted healthcare professionals</span>
              </li>
            </ul>
            
            <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur">
              <p className="italic text-blue-100">
                "MediBook has transformed how I manage my healthcare. Finding doctors and booking appointments has never been easier!"
              </p>
              <div className="mt-2 flex items-center">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-primary font-bold">
                  S
                </div>
                <div className="ml-2">
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-xs text-blue-200">Patient</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
