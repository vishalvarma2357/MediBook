import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'admin']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'cancelled', 'completed']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('patient'),
  imageUrl: text("image_url"),
  phone: text("phone"),
  address: text("address"),
  approved: boolean("approved").default(true),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  specialty: text("specialty").notNull(),
  bio: text("bio"),
  experience: integer("experience").default(0),
  rating: integer("rating").default(0),
  numberOfReviews: integer("number_of_reviews").default(0),
});

export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isBooked: boolean("is_booked").default(false),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  timeSlotId: integer("time_slot_id").notNull().references(() => timeSlots.id),
  status: appointmentStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const specialties = pgTable("specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true });
export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertSpecialtySchema = createInsertSchema(specialties).omit({ id: true });

// Registration schemas with validation
export const patientRegisterSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const doctorRegisterSchema = z.object({
  user: insertUserSchema,
  doctor: insertDoctorSchema.omit({ userId: true }),
  confirmPassword: z.string(),
}).refine((data) => data.user.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
export type User = typeof users.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Specialty = typeof specialties.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type PatientRegister = z.infer<typeof patientRegisterSchema>;
export type DoctorRegister = z.infer<typeof doctorRegisterSchema>;
export type Login = z.infer<typeof loginSchema>;

// Extended types with joined data
export type DoctorWithUser = Doctor & {
  user: User;
};

export type AppointmentWithDetails = Appointment & {
  doctor: DoctorWithUser;
  timeSlot: TimeSlot;
  patient: User;
};
