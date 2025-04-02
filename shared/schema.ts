import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

// Users table - base for all user types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN] }).notNull().default(UserRole.PATIENT),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctor profiles - extends users for doctors
export const doctorProfiles = pgTable("doctor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  specialization: text("specialization").notNull(),
  hospital: text("hospital").notNull(),
  location: text("location").notNull(),
  fee: integer("fee").notNull(),
  experience: integer("experience").notNull(),
  about: text("about"),
  status: text("status", { enum: [DoctorStatus.PENDING, DoctorStatus.APPROVED, DoctorStatus.REJECTED] }).notNull().default(DoctorStatus.PENDING),
  rating: integer("rating"),
  reviewCount: integer("review_count").default(0),
  profileImageUrl: text("profile_image_url"),
  officeImageUrl: text("office_image_url"),
});

// Availability slots for doctors
export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctorProfiles.id),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  startTime: text("start_time").notNull(), // Format: HH:MM (24h)
  endTime: text("end_time").notNull(), // Format: HH:MM (24h)
  duration: integer("duration").notNull(), // in minutes
  isBooked: boolean("is_booked").default(false),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => doctorProfiles.id),
  slotId: integer("slot_id").notNull().references(() => availabilitySlots.id),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  startTime: text("start_time").notNull(), // Format: HH:MM (24h)
  endTime: text("end_time").notNull(), // Format: HH:MM (24h)
  status: text("status", { enum: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.CHECKED_IN] }).notNull().default(AppointmentStatus.PENDING),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Specializations reference table
export const specializations = pgTable("specializations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertDoctorProfileSchema = createInsertSchema(doctorProfiles).omit({
  id: true,
  rating: true,
  reviewCount: true
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({
  id: true,
  isBooked: true
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true
});

export const insertSpecializationSchema = createInsertSchema(specializations).omit({
  id: true
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
    confirmPassword: z.string().min(1, "Confirm password is required")
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

export type PatientRegistration = z.infer<typeof patientRegistrationSchema>;
export type DoctorRegistration = z.infer<typeof doctorRegistrationSchema>;
export type Login = z.infer<typeof loginSchema>;

export type User = typeof users.$inferSelect;
export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Specialization = typeof specializations.$inferSelect;

// Combined types for frontend
export type Doctor = User & { profile: DoctorProfile };
export type DoctorWithAvailability = Doctor & { availabilitySlots: AvailabilitySlot[] };
export type AppointmentDetails = Appointment & { 
  doctor: Doctor,
  patient: User
};
