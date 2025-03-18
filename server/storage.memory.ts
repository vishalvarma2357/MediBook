import {
  User, InsertUser,
  DoctorProfile, InsertDoctorProfile,
  Appointment, InsertAppointment,
  AvailabilitySlot, InsertAvailabilitySlot,
  Specialization, InsertSpecialization,
  UserRole, AppointmentStatus, DoctorStatus
} from "@shared/schema";
import { IStorage } from "./storage";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// In-memory storage class
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  // Data storage
  private users: User[] = [];
  private doctorProfiles: DoctorProfile[] = [];
  private availabilitySlots: AvailabilitySlot[] = [];
  private appointments: Appointment[] = [];
  private specializations: Specialization[] = [];
  
  // ID counters
  private nextUserId = 1;
  private nextDoctorProfileId = 1;
  private nextAvailabilitySlotId = 1;
  private nextAppointmentId = 1;
  private nextSpecializationId = 1;

  constructor() {
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed initial data
    this.seedInitialData();
  }
  
  // Seed initial data
  private async seedInitialData() {
    try {
      // Seed specializations if none exist
      if ((await this.getAllSpecializations()).length === 0) {
        const specializations = [
          { name: "Cardiology" },
          { name: "Dermatology" },
          { name: "Neurology" },
          { name: "Orthopedics" },
          { name: "Pediatrics" },
          { name: "Psychiatry" },
          { name: "Ophthalmology" },
          { name: "Gynecology" },
          { name: "Oncology" },
          { name: "Urology" }
        ];
        
        for (const spec of specializations) {
          await this.createSpecialization(spec);
        }
        
        console.log("Seeded specializations");
      }
      
      // Create admin user if none exists
      const existingAdmin = await this.getUserByUsername("admin");
      
      if (!existingAdmin) {
        // Create admin user
        const adminUser = await this.createUser({
          username: "admin",
          password: "$2b$10$GJ9c1WtOPRGnD5/hCqUXE.5xCxw5YxrFZKvwOIZNw/JA2g4c.V1ZC", // "admin123"
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: UserRole.ADMIN
        });
        
        console.log(`Created admin user with username: ${adminUser.username}`);
      }
      
      // Create sample doctor if none exists
      const existingDoctor = await this.getUserByUsername("doctor");
      
      if (!existingDoctor) {
        // Create doctor user
        const doctorUser = await this.createUser({
          username: "doctor",
          password: "$2b$10$GJ9c1WtOPRGnD5/hCqUXE.5xCxw5YxrFZKvwOIZNw/JA2g4c.V1ZC", // "admin123"
          email: "doctor@example.com",
          firstName: "Doctor",
          lastName: "Smith",
          role: UserRole.DOCTOR
        });
        
        // Create doctor profile
        const doctorProfile = await this.createDoctorProfile({
          userId: doctorUser.id,
          specialization: "Cardiology",
          hospital: "General Hospital",
          location: "New York",
          fee: 150,
          experience: 10,
          about: "Experienced cardiologist with 10 years of practice.",
          status: DoctorStatus.APPROVED
        });
        
        // Create availability slots for the doctor
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
        
        const formatDate = (date: Date) => {
          return date.toISOString().split('T')[0];
        };
        
        // Create morning slots
        await this.createAvailabilitySlot({
          doctorId: doctorProfile.id,
          date: formatDate(tomorrow),
          startTime: "09:00",
          endTime: "09:30",
          duration: 30
        });
        
        await this.createAvailabilitySlot({
          doctorId: doctorProfile.id,
          date: formatDate(tomorrow),
          startTime: "09:30",
          endTime: "10:00",
          duration: 30
        });
        
        await this.createAvailabilitySlot({
          doctorId: doctorProfile.id,
          date: formatDate(tomorrow),
          startTime: "10:00",
          endTime: "10:30",
          duration: 30
        });
        
        // Create afternoon slots
        await this.createAvailabilitySlot({
          doctorId: doctorProfile.id,
          date: formatDate(dayAfterTomorrow),
          startTime: "14:00",
          endTime: "14:30",
          duration: 30
        });
        
        await this.createAvailabilitySlot({
          doctorId: doctorProfile.id,
          date: formatDate(dayAfterTomorrow),
          startTime: "14:30",
          endTime: "15:00",
          duration: 30
        });
        
        await this.createAvailabilitySlot({
          doctorId: doctorProfile.id,
          date: formatDate(dayAfterTomorrow),
          startTime: "15:00",
          endTime: "15:30",
          duration: 30
        });
        
        console.log(`Created doctor user with username: ${doctorUser.username}`);
      }
      
      // Create sample patient if none exists
      const existingPatient = await this.getUserByUsername("patient");
      
      if (!existingPatient) {
        // Create patient user
        const patientUser = await this.createUser({
          username: "patient",
          password: "$2b$10$GJ9c1WtOPRGnD5/hCqUXE.5xCxw5YxrFZKvwOIZNw/JA2g4c.V1ZC", // "admin123"
          email: "patient@example.com",
          firstName: "John",
          lastName: "Doe",
          role: UserRole.PATIENT
        });
        
        console.log(`Created patient user with username: ${patientUser.username}`);
      }
      
      console.log("Initial data seeding completed");
    } catch (error) {
      console.error("Error seeding initial data:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      ...userData,
      id: this.nextUserId++,
      role: userData.role || UserRole.PATIENT,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    const updatedUser = {
      ...this.users[index],
      ...userData
    };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  // Doctor profile operations
  async getDoctorProfile(id: number): Promise<DoctorProfile | undefined> {
    return this.doctorProfiles.find(profile => profile.id === id);
  }

  async getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined> {
    return this.doctorProfiles.find(profile => profile.userId === userId);
  }

  async createDoctorProfile(profileData: InsertDoctorProfile): Promise<DoctorProfile> {
    const profile: DoctorProfile = {
      ...profileData,
      id: this.nextDoctorProfileId++,
      status: profileData.status || DoctorStatus.PENDING,
      about: profileData.about || null,
      rating: profileData.rating || null,
      reviewCount: profileData.reviewCount || null,
      profileImageUrl: profileData.profileImageUrl || null,
      officeImageUrl: profileData.officeImageUrl || null
    };
    this.doctorProfiles.push(profile);
    return profile;
  }

  async updateDoctorProfile(id: number, profileData: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
    const index = this.doctorProfiles.findIndex(profile => profile.id === id);
    if (index === -1) return undefined;
    
    const updatedProfile = {
      ...this.doctorProfiles[index],
      ...profileData
    };
    this.doctorProfiles[index] = updatedProfile;
    return updatedProfile;
  }

  async getAllDoctors(status?: DoctorStatus): Promise<Array<User & { profile: DoctorProfile }>> {
    const result: Array<User & { profile: DoctorProfile }> = [];
    const doctorUsers = this.users.filter(user => user.role === UserRole.DOCTOR);
    
    for (const user of doctorUsers) {
      const profile = await this.getDoctorProfileByUserId(user.id);
      if (profile && (!status || profile.status === status)) {
        result.push({ ...user, profile });
      }
    }
    
    return result;
  }

  async getDoctorsBySpecialization(specialization: string): Promise<Array<User & { profile: DoctorProfile }>> {
    const result: Array<User & { profile: DoctorProfile }> = [];
    const doctorProfiles = this.doctorProfiles.filter(
      profile => profile.specialization === specialization && profile.status === DoctorStatus.APPROVED
    );
    
    for (const profile of doctorProfiles) {
      const user = await this.getUser(profile.userId);
      if (user) {
        result.push({ ...user, profile });
      }
    }
    
    return result;
  }

  // Availability slots operations
  async getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined> {
    return this.availabilitySlots.find(slot => slot.id === id);
  }

  async createAvailabilitySlot(slotData: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const slot: AvailabilitySlot = {
      ...slotData,
      id: this.nextAvailabilitySlotId++,
      isBooked: false
    };
    this.availabilitySlots.push(slot);
    return slot;
  }

  async updateAvailabilitySlot(id: number, slotData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot | undefined> {
    const index = this.availabilitySlots.findIndex(slot => slot.id === id);
    if (index === -1) return undefined;
    
    const updatedSlot = {
      ...this.availabilitySlots[index],
      ...slotData
    };
    this.availabilitySlots[index] = updatedSlot;
    return updatedSlot;
  }

  async getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]> {
    return this.availabilitySlots.filter(slot => slot.doctorId === doctorId);
  }

  async getAvailableSlotsForDoctor(doctorId: number, date?: string): Promise<AvailabilitySlot[]> {
    return this.availabilitySlots.filter(slot => {
      return slot.doctorId === doctorId && 
             (!date || slot.date === date) && 
             !slot.isBooked;
    });
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.find(appointment => appointment.id === id);
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const appointment: Appointment = {
      ...appointmentData,
      id: this.nextAppointmentId++,
      status: appointmentData.status || AppointmentStatus.PENDING,
      reason: appointmentData.reason || null,
      createdAt: new Date()
    };
    this.appointments.push(appointment);
    
    // Mark the slot as booked
    const slot = await this.getAvailabilitySlot(appointment.slotId);
    if (slot) {
      await this.updateAvailabilitySlot(slot.id, { isBooked: true });
    }
    
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const index = this.appointments.findIndex(appointment => appointment.id === id);
    if (index === -1) return undefined;
    
    const updatedAppointment = {
      ...this.appointments[index],
      ...appointmentData
    };
    this.appointments[index] = updatedAppointment;
    return updatedAppointment;
  }

  async getPatientAppointments(patientId: number, status?: AppointmentStatus): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile } }>> {
    const result: Array<Appointment & { doctor: User & { profile: DoctorProfile } }> = [];
    const patientAppointments = this.appointments.filter(
      appointment => appointment.patientId === patientId && (!status || appointment.status === status)
    );
    
    for (const appointment of patientAppointments) {
      const doctorProfile = await this.getDoctorProfile(appointment.doctorId);
      if (doctorProfile) {
        const doctor = await this.getUser(doctorProfile.userId);
        if (doctor) {
          result.push({
            ...appointment,
            doctor: { ...doctor, profile: doctorProfile }
          });
        }
      }
    }
    
    return result;
  }

  async getDoctorAppointments(doctorId: number, status?: AppointmentStatus): Promise<Array<Appointment & { patient: User }>> {
    const result: Array<Appointment & { patient: User }> = [];
    const doctorAppointments = this.appointments.filter(
      appointment => appointment.doctorId === doctorId && (!status || appointment.status === status)
    );
    
    for (const appointment of doctorAppointments) {
      const patient = await this.getUser(appointment.patientId);
      if (patient) {
        result.push({
          ...appointment,
          patient
        });
      }
    }
    
    return result;
  }

  async getAllAppointments(): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile }, patient: User }>> {
    const result: Array<Appointment & { doctor: User & { profile: DoctorProfile }, patient: User }> = [];
    
    for (const appointment of this.appointments) {
      const patient = await this.getUser(appointment.patientId);
      const doctorProfile = await this.getDoctorProfile(appointment.doctorId);
      
      if (patient && doctorProfile) {
        const doctor = await this.getUser(doctorProfile.userId);
        if (doctor) {
          result.push({
            ...appointment,
            doctor: { ...doctor, profile: doctorProfile },
            patient
          });
        }
      }
    }
    
    return result;
  }

  // Specialization operations
  async getAllSpecializations(): Promise<Specialization[]> {
    return this.specializations;
  }

  async createSpecialization(specializationData: InsertSpecialization): Promise<Specialization> {
    const specialization: Specialization = {
      ...specializationData,
      id: this.nextSpecializationId++
    };
    this.specializations.push(specialization);
    return specialization;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.users.filter(user => user.role === role);
  }
}

// Export in-memory storage instance
export const storage = new MemStorage();