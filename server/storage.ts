import { 
  User, InsertUser, 
  DoctorProfile, InsertDoctorProfile, 
  Appointment, InsertAppointment,
  AvailabilitySlot, InsertAvailabilitySlot,
  Specialization, InsertSpecialization,
  UserRole, AppointmentStatus, DoctorStatus
} from "@shared/schema";
import session from "express-session";

// Interface for all storage operations
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
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

// Import storage implementations
import { MemStorage } from "./models/memory-storage";
import { MongoStorage } from "./storage.mongo";

// Create a singleton storage instance
let storageInstance: IStorage;

// Initialize storage
export async function initializeStorage(useMongoDB = true): Promise<void> {
  try {
    if (useMongoDB) {
      console.log('[storage] Using MongoDB storage');
      storageInstance = new MongoStorage() as IStorage;
    } else {
      console.log('[storage] Using in-memory storage with sample data');
      storageInstance = new MemStorage();
    }
  } catch (error) {
    console.error('[storage] Error initializing storage:', error);
    console.log('[storage] Falling back to in-memory storage');
    storageInstance = new MemStorage();
  }
}

// Get the storage instance
export const storage: IStorage = new Proxy({} as IStorage, {
  get: (target, prop) => {
    if (!storageInstance) {
      // Initialize with in-memory storage if not already initialized
      console.log('[storage] Storage not initialized, using in-memory storage as fallback');
      storageInstance = new MemStorage();
    }
    return storageInstance[prop as keyof IStorage];
  }
});
