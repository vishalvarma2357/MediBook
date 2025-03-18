import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertAppointmentSchema, insertTimeSlotSchema } from "@shared/schema";

// Middleware to check authentication
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is a doctor
const isDoctor = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === "doctor") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Only doctors can access this resource" });
};

// Middleware to check if user is a patient
const isPatient = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === "patient") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Only patients can access this resource" });
};

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Only admins can access this resource" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Specialties routes
  app.get("/api/specialties", async (req, res) => {
    try {
      const specialties = await storage.getAllSpecialties();
      res.json(specialties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch specialties" });
    }
  });

  // Doctor routes
  app.get("/api/doctors", async (req, res) => {
    try {
      const specialty = req.query.specialty as string | undefined;
      
      let doctors;
      if (specialty) {
        doctors = await storage.getDoctorsBySpecialty(specialty);
      } else {
        doctors = await storage.getAllDoctors();
      }
      
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctorById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor" });
    }
  });

  // Time slot routes
  app.post("/api/timeslots", isDoctor, async (req, res) => {
    try {
      const parsedData = insertTimeSlotSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid time slot data" });
      }
      
      // Verify that the doctor is creating slots for themselves
      const doctor = await storage.getDoctorByUserId(req.user!.id);
      if (!doctor || doctor.id !== parsedData.data.doctorId) {
        return res.status(403).json({ message: "You can only create time slots for yourself" });
      }
      
      const timeSlot = await storage.createTimeSlot(parsedData.data);
      res.status(201).json(timeSlot);
    } catch (error) {
      res.status(500).json({ message: "Failed to create time slot" });
    }
  });

  app.get("/api/doctors/:id/timeslots", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const available = req.query.available === "true";
      
      let timeSlots;
      if (available) {
        timeSlots = await storage.getAvailableTimeSlotsByDoctorId(doctorId);
      } else {
        timeSlots = await storage.getTimeSlotsByDoctorId(doctorId);
      }
      
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  // Appointment routes
  app.post("/api/appointments", isPatient, async (req, res) => {
    try {
      const parsedData = insertAppointmentSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid appointment data" });
      }
      
      // Verify that the patient is creating an appointment for themselves
      if (req.user!.id !== parsedData.data.patientId) {
        return res.status(403).json({ message: "You can only create appointments for yourself" });
      }
      
      // Check if the time slot exists and is available
      const timeSlot = await storage.getTimeSlotById(parsedData.data.timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      
      if (timeSlot.isBooked) {
        return res.status(400).json({ message: "This time slot is already booked" });
      }
      
      const appointment = await storage.createAppointment(parsedData.data);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      let appointments;
      
      if (req.user!.role === "patient") {
        appointments = await storage.getAppointmentsByPatientId(req.user!.id);
      } else if (req.user!.role === "doctor") {
        const doctor = await storage.getDoctorByUserId(req.user!.id);
        if (!doctor) {
          return res.status(404).json({ message: "Doctor profile not found" });
        }
        appointments = await storage.getAppointmentsByDoctorId(doctor.id);
      } else if (req.user!.role === "admin") {
        // Admin can see all appointments, but we don't have that method yet
        // For now, we'll just return an empty array
        appointments = [];
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.patch("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointmentById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Check permissions
      if (
        req.user!.role === "patient" && appointment.patientId !== req.user!.id ||
        req.user!.role === "doctor" && appointment.doctor.id !== (await storage.getDoctorByUserId(req.user!.id))?.id
      ) {
        return res.status(403).json({ message: "You don't have permission to update this appointment" });
      }
      
      // Patients can only cancel appointments
      if (req.user!.role === "patient" && req.body.status && req.body.status !== "cancelled") {
        return res.status(403).json({ message: "Patients can only cancel appointments" });
      }
      
      const updatedAppointment = await storage.updateAppointment(appointmentId, req.body);
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/doctors/:id/approve", isAdmin, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctorById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      const updatedUser = await storage.updateUser(doctor.user.id, { approved: true });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve doctor" });
    }
  });

  app.patch("/api/admin/doctors/:id/reject", isAdmin, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctorById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      const updatedUser = await storage.updateUser(doctor.user.id, { approved: false });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject doctor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
