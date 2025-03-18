import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  UserRole, 
  DoctorStatus, 
  AppointmentStatus,
  insertAppointmentSchema,
  insertAvailabilitySlotSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const { requireAuth, requireRole, requireApprovedDoctor } = setupAuth(app);

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      res.status(400).json({ message: validationError.message });
    } else {
      next(err);
    }
  });

  // API Routes
  
  // ----- SPECIALIZATIONS -----
  app.get("/api/specializations", async (req: Request, res: Response) => {
    try {
      const specializations = await storage.getAllSpecializations();
      res.json(specializations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching specializations" });
    }
  });

  // ----- DOCTORS -----
  app.get("/api/doctors", async (req: Request, res: Response) => {
    try {
      // Get approved doctors only for public view
      const doctors = await storage.getAllDoctors(DoctorStatus.APPROVED);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching doctors" });
    }
  });

  app.get("/api/doctors/specialization/:specialization", async (req: Request, res: Response) => {
    try {
      const { specialization } = req.params;
      const doctors = await storage.getDoctorsBySpecialization(specialization);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching doctors by specialization" });
    }
  });

  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const doctorProfile = await storage.getDoctorProfile(parseInt(id));
      
      if (!doctorProfile) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Only show approved doctors unless admin or the doctor themselves
      if (doctorProfile.status !== DoctorStatus.APPROVED && 
          (!req.isAuthenticated() || 
           (req.user.role !== UserRole.ADMIN && 
            req.user.role !== UserRole.DOCTOR && 
            req.user.id !== doctorProfile.userId))) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      const doctor = await storage.getUser(doctorProfile.userId);
      res.json({ ...doctor, profile: doctorProfile, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Error fetching doctor" });
    }
  });

  // ----- AVAILABILITY -----
  app.get("/api/doctors/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      
      // Only get slots that are available
      const availableSlots = await storage.getAvailableSlotsForDoctor(
        parseInt(id), 
        date as string | undefined
      );
      
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ message: "Error fetching availability" });
    }
  });

  app.post("/api/availability", requireApprovedDoctor, async (req, res) => {
    try {
      // Get the doctor's profile
      const doctorProfile = await storage.getDoctorProfileByUserId(req.user.id);
      if (!doctorProfile) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      // Validate the slot data
      const validateSlot = insertAvailabilitySlotSchema.parse({
        ...req.body,
        doctorId: doctorProfile.id
      });
      
      // Create the slot
      const slot = await storage.createAvailabilitySlot(validateSlot);
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Error creating availability slot" });
      }
    }
  });

  app.delete("/api/availability/:id", requireApprovedDoctor, async (req, res) => {
    try {
      const { id } = req.params;
      const slot = await storage.getAvailabilitySlot(parseInt(id));
      
      if (!slot) {
        return res.status(404).json({ message: "Availability slot not found" });
      }
      
      // Ensure the slot belongs to the doctor
      const doctorProfile = await storage.getDoctorProfileByUserId(req.user.id);
      if (doctorProfile?.id !== slot.doctorId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Can't delete booked slots
      if (slot.isBooked) {
        return res.status(400).json({ message: "Cannot delete a booked slot" });
      }
      
      // Mark as booked to effectively delete it
      await storage.updateAvailabilitySlot(parseInt(id), { isBooked: true });
      
      res.status(200).json({ message: "Slot deleted" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting availability slot" });
    }
  });

  // ----- APPOINTMENTS -----
  app.post("/api/appointments", requireAuth, async (req, res) => {
    try {
      // Patients can only book for themselves
      if (req.user.role === UserRole.PATIENT) {
        req.body.patientId = req.user.id;
      }
      
      // Validate the appointment data
      const validatedAppointment = insertAppointmentSchema.parse(req.body);
      
      // Check if the slot exists and is available
      const slot = await storage.getAvailabilitySlot(validatedAppointment.slotId);
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      
      if (slot.isBooked) {
        return res.status(400).json({ message: "Slot is already booked" });
      }
      
      // Create the appointment
      const appointment = await storage.createAppointment(validatedAppointment);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Error creating appointment" });
      }
    }
  });

  app.get("/api/appointments/patient", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getPatientAppointments(req.user.id);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments" });
    }
  });

  app.get("/api/appointments/doctor", requireApprovedDoctor, async (req, res) => {
    try {
      const doctorProfile = await storage.getDoctorProfileByUserId(req.user.id);
      if (!doctorProfile) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      const { status } = req.query;
      const appointments = await storage.getDoctorAppointments(
        doctorProfile.id,
        status as AppointmentStatus | undefined
      );
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments" });
    }
  });

  app.put("/api/appointments/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const appointment = await storage.getAppointment(parseInt(id));
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Check permissions
      if (req.user.role === UserRole.PATIENT) {
        // Patients can only cancel their own appointments
        if (appointment.patientId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        if (status !== AppointmentStatus.CANCELLED) {
          return res.status(403).json({ message: "Patients can only cancel appointments" });
        }
      } else if (req.user.role === UserRole.DOCTOR) {
        // Doctors can update status of their own appointments
        const doctorProfile = await storage.getDoctorProfileByUserId(req.user.id);
        if (appointment.doctorId !== doctorProfile?.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Update the appointment
      const updatedAppointment = await storage.updateAppointment(parseInt(id), { status });
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Error updating appointment status" });
    }
  });

  // ----- ADMIN ROUTES -----
  app.get("/api/admin/doctors/pending", requireRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingDoctors = await storage.getAllDoctors(DoctorStatus.PENDING);
      res.json(pendingDoctors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending doctors" });
    }
  });

  app.put("/api/admin/doctors/:id/approve", requireRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const doctorProfile = await storage.getDoctorProfile(parseInt(id));
      
      if (!doctorProfile) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      const updatedProfile = await storage.updateDoctorProfile(parseInt(id), {
        status: DoctorStatus.APPROVED
      });
      
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Error approving doctor" });
    }
  });

  app.put("/api/admin/doctors/:id/reject", requireRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const doctorProfile = await storage.getDoctorProfile(parseInt(id));
      
      if (!doctorProfile) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }
      
      const updatedProfile = await storage.updateDoctorProfile(parseInt(id), {
        status: DoctorStatus.REJECTED
      });
      
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Error rejecting doctor" });
    }
  });

  app.get("/api/admin/users", requireRole(UserRole.ADMIN), async (req, res) => {
    try {
      const { role } = req.query;
      let users;
      
      if (role) {
        users = await storage.getUsersByRole(role as UserRole);
      } else {
        users = await storage.getAllUsers();
      }
      
      // Remove passwords
      const safeUsers = users.map(user => ({ ...user, password: undefined }));
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/admin/appointments", requireRole(UserRole.ADMIN), async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
