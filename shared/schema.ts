import { z } from "zod";

// User roles
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin'
}

// Appointment status
export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  CHECKED_IN = 'checked_in'
}

// Doctor approval status
export enum DoctorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Type definitions - in-memory implementation

// User type
export type User = {
  id: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // UserRole
  createdAt: Date | null;
};

// Doctor profile type
export type DoctorProfile = {
  id: number;
  userId: number;
  specialization: string;
  hospital: string;
  location: string;
  fee: number;
  experience: number;
  status: string; // DoctorStatus
  about: string | null;
  rating: number | null;
  reviewCount: number | null;
  profileImageUrl: string | null;
  officeImageUrl: string | null;
};

// Availability slot type
export type AvailabilitySlot = {
  id: number;
  doctorId: number;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM (24h)
  endTime: string; // Format: HH:MM (24h)
  duration: number; // in minutes
  isBooked: boolean | null;
};

// Appointment type
export type Appointment = {
  id: number;
  patientId: number;
  doctorId: number;
  slotId: number;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM (24h)
  endTime: string; // Format: HH:MM (24h)
  status: string; // AppointmentStatus
  reason: string | null;
  createdAt: Date | null;
};

// Specialization type
export type Specialization = {
  id: number;
  name: string;
};

// Insert schemas using Zod
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.string().optional(),
});

export const insertDoctorProfileSchema = z.object({
  userId: z.number(),
  specialization: z.string().min(1, "Specialization is required"),
  hospital: z.string().min(1, "Hospital name is required"),
  location: z.string().min(1, "Location is required"),
  fee: z.number().min(0, "Fee must be at least 0"),
  experience: z.number().min(0, "Experience cannot be negative"),
  status: z.string().optional(),
  about: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  officeImageUrl: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  reviewCount: z.number().nullable().optional(),
});

export const insertAvailabilitySlotSchema = z.object({
  doctorId: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  duration: z.number().min(5, "Duration must be at least 5 minutes"),
  isBooked: z.boolean().optional(),
});

export const insertAppointmentSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  slotId: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string(),
  endTime: z.string(),
  status: z.string().optional(),
  reason: z.string().nullable().optional(),
});

export const insertSpecializationSchema = z.object({
  name: z.string().min(1, "Specialization name is required"),
});

// Extension schemas for registration
export const patientRegistrationSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const doctorRegistrationSchema = z.object({
  user: insertUserSchema.extend({
    confirmPassword: z.string()
  }),
  profile: insertDoctorProfileSchema.omit({ userId: true, status: true })
}).refine((data) => data.user.password === data.user.confirmPassword, {
  message: "Passwords don't match",
  path: ["user", "confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

export type PatientRegistration = z.infer<typeof patientRegistrationSchema>;
export type DoctorRegistration = z.infer<typeof doctorRegistrationSchema>;
export type Login = z.infer<typeof loginSchema>;

// Combined types for frontend
export type Doctor = User & { profile: DoctorProfile };
export type DoctorWithAvailability = Doctor & { availabilitySlots: AvailabilitySlot[] };
export type AppointmentDetails = Appointment & { 
  doctor: Doctor,
  patient: User
};
