import { 
  User, InsertUser, 
  DoctorProfile, InsertDoctorProfile, 
  Appointment, InsertAppointment,
  AvailabilitySlot, InsertAvailabilitySlot,
  Specialization, InsertSpecialization,
  UserRole, AppointmentStatus, DoctorStatus
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Doctor profile operations
  getDoctorProfile(id: number): Promise<DoctorProfile | undefined>;
  getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined>;
  createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile>;
  updateDoctorProfile(id: number, profileData: Partial<DoctorProfile>): Promise<DoctorProfile | undefined>;
  getAllDoctors(status?: DoctorStatus): Promise<Array<User & { profile: DoctorProfile }>>;
  getDoctorsBySpecialization(specialization: string): Promise<Array<User & { profile: DoctorProfile }>>;
  
  // Availability slots operations
  getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined>;
  createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot>;
  updateAvailabilitySlot(id: number, slotData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot | undefined>;
  getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]>;
  getAvailableSlotsForDoctor(doctorId: number, date?: string): Promise<AvailabilitySlot[]>;
  
  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined>;
  getPatientAppointments(patientId: number, status?: AppointmentStatus): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile } }>>;
  getDoctorAppointments(doctorId: number, status?: AppointmentStatus): Promise<Array<Appointment & { patient: User }>>;
  getAllAppointments(): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile }, patient: User }>>;
  
  // Specialization operations
  getAllSpecializations(): Promise<Specialization[]>;
  createSpecialization(specialization: InsertSpecialization): Promise<Specialization>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: UserRole): Promise<User[]>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctorProfiles: Map<number, DoctorProfile>;
  private availabilitySlots: Map<number, AvailabilitySlot>;
  private appointments: Map<number, Appointment>;
  private specializations: Map<number, Specialization>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private doctorProfileIdCounter: number;
  private availabilitySlotIdCounter: number;
  private appointmentIdCounter: number;
  private specializationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.doctorProfiles = new Map();
    this.availabilitySlots = new Map();
    this.appointments = new Map();
    this.specializations = new Map();
    
    this.userIdCounter = 1;
    this.doctorProfileIdCounter = 1;
    this.availabilitySlotIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.specializationIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with specializations and admin user
    this.seedInitialData();
  }

  private seedInitialData() {
    // Add specializations
    const specializations = [
      "Cardiology", "Neurology", "Dermatology", "Orthopedics", 
      "Pediatrics", "Psychiatry", "Gynecology", "Ophthalmology",
      "Dentistry", "General Practice"
    ];
    
    specializations.forEach(name => {
      this.createSpecialization({ name });
    });
    
    // Add admin user
    this.createUser({
      username: "admin",
      password: "adminpassword", // Will be hashed in auth.ts
      email: "admin@medibook.com",
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Doctor profile operations
  async getDoctorProfile(id: number): Promise<DoctorProfile | undefined> {
    return this.doctorProfiles.get(id);
  }
  
  async getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined> {
    return Array.from(this.doctorProfiles.values()).find(profile => profile.userId === userId);
  }
  
  async createDoctorProfile(profileData: InsertDoctorProfile): Promise<DoctorProfile> {
    const id = this.doctorProfileIdCounter++;
    const profile: DoctorProfile = { 
      ...profileData, 
      id, 
      rating: 0, 
      reviewCount: 0 
    };
    this.doctorProfiles.set(id, profile);
    return profile;
  }
  
  async updateDoctorProfile(id: number, profileData: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
    const profile = this.doctorProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...profileData };
    this.doctorProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  async getAllDoctors(status?: DoctorStatus): Promise<Array<User & { profile: DoctorProfile }>> {
    const doctorProfiles = Array.from(this.doctorProfiles.values());
    const filteredProfiles = status 
      ? doctorProfiles.filter(profile => profile.status === status)
      : doctorProfiles;
    
    return filteredProfiles.map(profile => {
      const user = this.users.get(profile.userId);
      if (!user) throw new Error(`User not found for doctor profile ${profile.id}`);
      return { ...user, profile };
    });
  }
  
  async getDoctorsBySpecialization(specialization: string): Promise<Array<User & { profile: DoctorProfile }>> {
    const doctors = await this.getAllDoctors(DoctorStatus.APPROVED);
    return doctors.filter(doctor => doctor.profile.specialization === specialization);
  }
  
  // Availability slots operations
  async getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined> {
    return this.availabilitySlots.get(id);
  }
  
  async createAvailabilitySlot(slotData: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const id = this.availabilitySlotIdCounter++;
    const slot: AvailabilitySlot = { ...slotData, id, isBooked: false };
    this.availabilitySlots.set(id, slot);
    return slot;
  }
  
  async updateAvailabilitySlot(id: number, slotData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot | undefined> {
    const slot = this.availabilitySlots.get(id);
    if (!slot) return undefined;
    
    const updatedSlot = { ...slot, ...slotData };
    this.availabilitySlots.set(id, updatedSlot);
    return updatedSlot;
  }
  
  async getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]> {
    return Array.from(this.availabilitySlots.values())
      .filter(slot => slot.doctorId === doctorId);
  }
  
  async getAvailableSlotsForDoctor(doctorId: number, date?: string): Promise<AvailabilitySlot[]> {
    const slots = Array.from(this.availabilitySlots.values())
      .filter(slot => slot.doctorId === doctorId && !slot.isBooked);
    
    if (date) {
      return slots.filter(slot => slot.date === date);
    }
    
    return slots;
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const createdAt = new Date();
    const appointment: Appointment = { ...appointmentData, id, createdAt };
    this.appointments.set(id, appointment);
    
    // Mark the slot as booked
    const slot = await this.getAvailabilitySlot(appointmentData.slotId);
    if (slot) {
      await this.updateAvailabilitySlot(slot.id, { isBooked: true });
    }
    
    return appointment;
  }
  
  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    
    // If appointment is cancelled, make the slot available again
    if (appointmentData.status === AppointmentStatus.CANCELLED) {
      const slot = await this.getAvailabilitySlot(appointment.slotId);
      if (slot) {
        await this.updateAvailabilitySlot(slot.id, { isBooked: false });
      }
    }
    
    return updatedAppointment;
  }
  
  async getPatientAppointments(patientId: number, status?: AppointmentStatus): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile } }>> {
    const appointments = Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId);
    
    const filteredAppointments = status
      ? appointments.filter(appointment => appointment.status === status)
      : appointments;
    
    return Promise.all(filteredAppointments.map(async appointment => {
      const doctorProfile = await this.getDoctorProfile(appointment.doctorId);
      if (!doctorProfile) throw new Error(`Doctor profile not found for appointment ${appointment.id}`);
      
      const doctor = await this.getUser(doctorProfile.userId);
      if (!doctor) throw new Error(`User not found for doctor profile ${doctorProfile.id}`);
      
      return { ...appointment, doctor: { ...doctor, profile: doctorProfile } };
    }));
  }
  
  async getDoctorAppointments(doctorId: number, status?: AppointmentStatus): Promise<Array<Appointment & { patient: User }>> {
    const appointments = Array.from(this.appointments.values())
      .filter(appointment => appointment.doctorId === doctorId);
    
    const filteredAppointments = status
      ? appointments.filter(appointment => appointment.status === status)
      : appointments;
    
    return Promise.all(filteredAppointments.map(async appointment => {
      const patient = await this.getUser(appointment.patientId);
      if (!patient) throw new Error(`Patient not found for appointment ${appointment.id}`);
      
      return { ...appointment, patient };
    }));
  }
  
  async getAllAppointments(): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile }, patient: User }>> {
    const appointments = Array.from(this.appointments.values());
    
    return Promise.all(appointments.map(async appointment => {
      const doctorProfile = await this.getDoctorProfile(appointment.doctorId);
      if (!doctorProfile) throw new Error(`Doctor profile not found for appointment ${appointment.id}`);
      
      const doctor = await this.getUser(doctorProfile.userId);
      if (!doctor) throw new Error(`User not found for doctor profile ${doctorProfile.id}`);
      
      const patient = await this.getUser(appointment.patientId);
      if (!patient) throw new Error(`Patient not found for appointment ${appointment.id}`);
      
      return { 
        ...appointment, 
        doctor: { ...doctor, profile: doctorProfile },
        patient
      };
    }));
  }
  
  // Specialization operations
  async getAllSpecializations(): Promise<Specialization[]> {
    return Array.from(this.specializations.values());
  }
  
  async createSpecialization(specializationData: InsertSpecialization): Promise<Specialization> {
    const id = this.specializationIdCounter++;
    const specialization: Specialization = { ...specializationData, id };
    this.specializations.set(id, specialization);
    return specialization;
  }
  
  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role);
  }
}

export const storage = new MemStorage();
