// Temporary memory storage implementation
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { 
  User, InsertUser, 
  DoctorProfile, InsertDoctorProfile, 
  Appointment, InsertAppointment,
  AvailabilitySlot, InsertAvailabilitySlot,
  Specialization, InsertSpecialization,
  UserRole, AppointmentStatus, DoctorStatus
} from "@shared/schema";
import { IStorage } from "../storage";

// Create memory store
const MemoryStore = createMemoryStore(session);

// Memory storage implementation
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: User[] = [];
  private doctorProfiles: DoctorProfile[] = [];
  private availabilitySlots: AvailabilitySlot[] = [];
  private appointments: Appointment[] = [];
  private specializations: Specialization[] = [];
  private lastIds = {
    users: 0,
    doctorProfiles: 0,
    availabilitySlots: 0,
    appointments: 0,
    specializations: 0
  };
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with specializations and admin user
    this.seedInitialData();
  }
  
  private async seedInitialData() {
    try {
      if (this.specializations.length === 0) {
        // Add specializations
        const specializations = [
          "Cardiology", "Neurology", "Dermatology", "Orthopedics", 
          "Pediatrics", "Psychiatry", "Gynecology", "Ophthalmology",
          "Dentistry", "General Practice"
        ];
        
        for (const name of specializations) {
          await this.createSpecialization({ name });
        }
        
        console.log('[database] Specializations seeded successfully');
      }
      
      // Check if admin user exists
      const adminExists = this.users.some(user => user.username === "admin");
      
      if (!adminExists) {
        // Add admin user
        await this.createUser({
          username: "admin",
          password: "adminpassword", // Will be hashed in auth.ts
          email: "admin@medibook.com",
          firstName: "Admin",
          lastName: "User",
          role: UserRole.ADMIN
        });
        
        console.log('[database] Admin user seeded successfully');
      }
    } catch (error) {
      console.error('[database] Error seeding initial data:', error);
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
    const id = ++this.lastIds.users;
    const newUser: User = {
      ...userData,
      id,
      // Ensure role is set (not undefined)
      role: userData.role || UserRole.PATIENT,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData
    };
    
    return this.users[userIndex];
  }
  
  // Doctor profile operations
  async getDoctorProfile(id: number): Promise<DoctorProfile | undefined> {
    return this.doctorProfiles.find(profile => profile.id === id);
  }
  
  async getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined> {
    return this.doctorProfiles.find(profile => profile.userId === userId);
  }
  
  async createDoctorProfile(profileData: InsertDoctorProfile): Promise<DoctorProfile> {
    const id = ++this.lastIds.doctorProfiles;
    const newProfile: DoctorProfile = {
      ...profileData,
      id,
      rating: 0,
      reviewCount: 0,
      // Ensure status is set (not undefined)
      status: profileData.status || DoctorStatus.PENDING,
      // Set defaults for optional fields
      about: profileData.about || null,
      profileImageUrl: profileData.profileImageUrl || null,
      officeImageUrl: profileData.officeImageUrl || null
    };
    this.doctorProfiles.push(newProfile);
    return newProfile;
  }
  
  async updateDoctorProfile(id: number, profileData: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
    const profileIndex = this.doctorProfiles.findIndex(profile => profile.id === id);
    if (profileIndex === -1) return undefined;
    
    this.doctorProfiles[profileIndex] = {
      ...this.doctorProfiles[profileIndex],
      ...profileData
    };
    
    return this.doctorProfiles[profileIndex];
  }
  
  async getAllDoctors(status?: DoctorStatus): Promise<Array<User & { profile: DoctorProfile }>> {
    const profiles = status 
      ? this.doctorProfiles.filter(profile => profile.status === status)
      : this.doctorProfiles;
    
    const result: Array<User & { profile: DoctorProfile }> = [];
    
    for (const profile of profiles) {
      const user = this.users.find(user => user.id === profile.userId);
      if (user) {
        result.push({
          ...user,
          profile
        });
      }
    }
    
    return result;
  }
  
  async getDoctorsBySpecialization(specialization: string): Promise<Array<User & { profile: DoctorProfile }>> {
    const profiles = this.doctorProfiles.filter(
      profile => profile.specialization === specialization && profile.status === DoctorStatus.APPROVED
    );
    
    const result: Array<User & { profile: DoctorProfile }> = [];
    
    for (const profile of profiles) {
      const user = this.users.find(user => user.id === profile.userId);
      if (user) {
        result.push({
          ...user,
          profile
        });
      }
    }
    
    return result;
  }
  
  // Availability slots operations
  async getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined> {
    return this.availabilitySlots.find(slot => slot.id === id);
  }
  
  async createAvailabilitySlot(slotData: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const id = ++this.lastIds.availabilitySlots;
    const newSlot: AvailabilitySlot = {
      ...slotData,
      id,
      isBooked: false
    };
    this.availabilitySlots.push(newSlot);
    return newSlot;
  }
  
  async updateAvailabilitySlot(id: number, slotData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot | undefined> {
    const slotIndex = this.availabilitySlots.findIndex(slot => slot.id === id);
    if (slotIndex === -1) return undefined;
    
    this.availabilitySlots[slotIndex] = {
      ...this.availabilitySlots[slotIndex],
      ...slotData
    };
    
    return this.availabilitySlots[slotIndex];
  }
  
  async getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]> {
    return this.availabilitySlots.filter(slot => slot.doctorId === doctorId);
  }
  
  async getAvailableSlotsForDoctor(doctorId: number, date?: string): Promise<AvailabilitySlot[]> {
    let slots = this.availabilitySlots.filter(
      slot => slot.doctorId === doctorId && !slot.isBooked
    );
    
    if (date) {
      slots = slots.filter(slot => slot.date === date);
    }
    
    return slots;
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.find(appointment => appointment.id === id);
  }
  
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = ++this.lastIds.appointments;
    const newAppointment: Appointment = {
      ...appointmentData,
      id,
      // Ensure status is set (not undefined)
      status: appointmentData.status || AppointmentStatus.PENDING,
      // Set defaults for optional fields
      reason: appointmentData.reason || null,
      createdAt: new Date()
    };
    this.appointments.push(newAppointment);
    
    // Mark the slot as booked
    const slotIndex = this.availabilitySlots.findIndex(slot => slot.id === appointmentData.slotId);
    if (slotIndex !== -1) {
      this.availabilitySlots[slotIndex].isBooked = true;
    }
    
    return newAppointment;
  }
  
  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointmentIndex = this.appointments.findIndex(appointment => appointment.id === id);
    if (appointmentIndex === -1) return undefined;
    
    this.appointments[appointmentIndex] = {
      ...this.appointments[appointmentIndex],
      ...appointmentData
    };
    
    // If appointment is cancelled, make the slot available again
    if (appointmentData.status === AppointmentStatus.CANCELLED) {
      const slotId = this.appointments[appointmentIndex].slotId;
      const slotIndex = this.availabilitySlots.findIndex(slot => slot.id === slotId);
      if (slotIndex !== -1) {
        this.availabilitySlots[slotIndex].isBooked = false;
      }
    }
    
    return this.appointments[appointmentIndex];
  }
  
  async getPatientAppointments(patientId: number, status?: AppointmentStatus): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile } }>> {
    let appointments = this.appointments.filter(appointment => appointment.patientId === patientId);
    
    if (status) {
      appointments = appointments.filter(appointment => appointment.status === status);
    }
    
    const result: Array<Appointment & { doctor: User & { profile: DoctorProfile } }> = [];
    
    for (const appointment of appointments) {
      const doctorProfile = this.doctorProfiles.find(profile => profile.id === appointment.doctorId);
      if (!doctorProfile) continue;
      
      const doctor = this.users.find(user => user.id === doctorProfile.userId);
      if (!doctor) continue;
      
      result.push({
        ...appointment,
        doctor: {
          ...doctor,
          profile: doctorProfile
        }
      });
    }
    
    return result;
  }
  
  async getDoctorAppointments(doctorId: number, status?: AppointmentStatus): Promise<Array<Appointment & { patient: User }>> {
    let appointments = this.appointments.filter(appointment => appointment.doctorId === doctorId);
    
    if (status) {
      appointments = appointments.filter(appointment => appointment.status === status);
    }
    
    const result: Array<Appointment & { patient: User }> = [];
    
    for (const appointment of appointments) {
      const patient = this.users.find(user => user.id === appointment.patientId);
      if (!patient) continue;
      
      result.push({
        ...appointment,
        patient
      });
    }
    
    return result;
  }
  
  async getAllAppointments(): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile }, patient: User }>> {
    const result: Array<Appointment & { doctor: User & { profile: DoctorProfile }, patient: User }> = [];
    
    for (const appointment of this.appointments) {
      const doctorProfile = this.doctorProfiles.find(profile => profile.id === appointment.doctorId);
      if (!doctorProfile) continue;
      
      const doctor = this.users.find(user => user.id === doctorProfile.userId);
      if (!doctor) continue;
      
      const patient = this.users.find(user => user.id === appointment.patientId);
      if (!patient) continue;
      
      result.push({
        ...appointment,
        doctor: {
          ...doctor,
          profile: doctorProfile
        },
        patient
      });
    }
    
    return result;
  }
  
  // Specialization operations
  async getAllSpecializations(): Promise<Specialization[]> {
    return this.specializations;
  }
  
  async createSpecialization(specializationData: InsertSpecialization): Promise<Specialization> {
    const id = ++this.lastIds.specializations;
    const newSpecialization: Specialization = {
      ...specializationData,
      id
    };
    this.specializations.push(newSpecialization);
    return newSpecialization;
  }
  
  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return this.users;
  }
  
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.users.filter(user => user.role === role);
  }
}