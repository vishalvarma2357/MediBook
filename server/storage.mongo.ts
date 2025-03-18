import { 
  User as UserType, InsertUser, 
  DoctorProfile as DoctorProfileType, InsertDoctorProfile, 
  Appointment as AppointmentType, InsertAppointment,
  AvailabilitySlot as AvailabilitySlotType, InsertAvailabilitySlot,
  Specialization as SpecializationType, InsertSpecialization,
  UserRole, AppointmentStatus, DoctorStatus
} from "@shared/schema";
import session from "express-session";
import { IStorage } from "./storage";
import { User, IUser } from "./models/user.model";
import { DoctorProfile, IDoctorProfile } from "./models/doctor-profile.model";
import { AvailabilitySlot, IAvailabilitySlot } from "./models/availability-slot.model";
import { Appointment, IAppointment } from "./models/appointment.model";
import { Specialization, ISpecialization } from "./models/specialization.model";
import { mongoSessionStore } from "./db";
import mongoose from 'mongoose';

// MongoDB storage implementation
export class MongoStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = mongoSessionStore({
      secret: process.env.SESSION_SECRET || 'medibook-session-secret'
    });
    
    // Seed initial data
    this.seedInitialData();
  }
  
  private async seedInitialData() {
    try {
      // Seed specializations
      const specializationCount = await Specialization.countDocuments();
      if (specializationCount === 0) {
        const specializations = [
          "Cardiology", "Neurology", "Dermatology", "Orthopedics", 
          "Pediatrics", "Psychiatry", "Gynecology", "Ophthalmology",
          "Dentistry", "General Practice"
        ];
        
        for (const name of specializations) {
          await Specialization.create({ 
            id: specializations.indexOf(name) + 1,
            name 
          });
        }
        
        console.log('[database] Specializations seeded successfully');
      }
      
      // Check if admin user exists
      const adminExists = await User.findOne({ username: "admin" });
      
      if (!adminExists) {
        // Add admin user
        const hashedPassword = "adminpassword"; // Note: In a real app, this would be hashed
        await User.create({
          id: 1,
          username: "admin",
          password: hashedPassword,
          email: "admin@medibook.com",
          firstName: "Admin",
          lastName: "User",
          role: UserRole.ADMIN,
          createdAt: new Date()
        });
        
        console.log('[database] Admin user seeded successfully');
      }

      // Seed some sample doctors
      const doctorCount = await User.countDocuments({ role: UserRole.DOCTOR });
      if (doctorCount === 0) {
        // Create sample doctors
        const sampleDoctors = [
          {
            user: {
              id: 2,
              username: "dr.smith",
              password: "password123", // In real app, would be hashed
              email: "dr.smith@medibook.com",
              firstName: "John",
              lastName: "Smith",
              role: UserRole.DOCTOR,
              createdAt: new Date()
            },
            profile: {
              id: 1,
              userId: 2,
              specialization: "Cardiology",
              hospital: "Heart & Vascular Center",
              location: "123 Medical Blvd, New York, NY",
              fee: 150,
              experience: 15,
              about: "Specialized in cardiovascular health with 15 years of experience.",
              status: DoctorStatus.APPROVED,
              rating: 4.8,
              reviewCount: 124,
              profileImageUrl: null,
              officeImageUrl: null
            }
          },
          {
            user: {
              id: 3,
              username: "dr.johnson",
              password: "password123", // In real app, would be hashed
              email: "dr.johnson@medibook.com",
              firstName: "Sarah",
              lastName: "Johnson",
              role: UserRole.DOCTOR,
              createdAt: new Date()
            },
            profile: {
              id: 2,
              userId: 3,
              specialization: "Neurology",
              hospital: "Neuro Science Institute",
              location: "456 Health St, Boston, MA",
              fee: 180,
              experience: 12,
              about: "Specializing in neurological disorders and treatments.",
              status: DoctorStatus.APPROVED,
              rating: 4.6,
              reviewCount: 98,
              profileImageUrl: null,
              officeImageUrl: null
            }
          },
          {
            user: {
              id: 4,
              username: "dr.patel",
              password: "password123", // In real app, would be hashed
              email: "dr.patel@medibook.com",
              firstName: "Raj",
              lastName: "Patel",
              role: UserRole.DOCTOR,
              createdAt: new Date()
            },
            profile: {
              id: 3,
              userId: 4,
              specialization: "Pediatrics",
              hospital: "Children's Wellness Center",
              location: "789 Care Ave, Chicago, IL",
              fee: 130,
              experience: 10,
              about: "Passionate about children's health with a gentle approach.",
              status: DoctorStatus.APPROVED,
              rating: 4.9,
              reviewCount: 156,
              profileImageUrl: null,
              officeImageUrl: null
            }
          }
        ];

        for (const doctor of sampleDoctors) {
          await User.create(doctor.user);
          await DoctorProfile.create(doctor.profile);
          
          // Add availability slots for each doctor
          const today = new Date();
          for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Add morning slots
            for (let hour = 9; hour < 12; hour++) {
              await AvailabilitySlot.create({
                id: this.getNextSlotId(),
                doctorId: doctor.profile.id,
                date: dateStr,
                startTime: `${hour}:00`,
                endTime: `${hour}:30`,
                duration: 30,
                isBooked: false
              });
              
              await AvailabilitySlot.create({
                id: this.getNextSlotId(),
                doctorId: doctor.profile.id,
                date: dateStr,
                startTime: `${hour}:30`,
                endTime: `${hour+1}:00`,
                duration: 30,
                isBooked: false
              });
            }
            
            // Add afternoon slots
            for (let hour = 14; hour < 17; hour++) {
              await AvailabilitySlot.create({
                id: this.getNextSlotId(),
                doctorId: doctor.profile.id,
                date: dateStr,
                startTime: `${hour}:00`,
                endTime: `${hour}:30`,
                duration: 30,
                isBooked: false
              });
              
              await AvailabilitySlot.create({
                id: this.getNextSlotId(),
                doctorId: doctor.profile.id,
                date: dateStr,
                startTime: `${hour}:30`,
                endTime: `${hour+1}:00`,
                duration: 30,
                isBooked: false
              });
            }
          }
        }
        
        console.log('[database] Sample doctors and availability slots seeded successfully');
      }
      
    } catch (error) {
      console.error('[database] Error seeding initial data:', error);
    }
  }
  
  // Helper method to generate slot IDs (used in seeding)
  private slotIdCounter = 0;
  private getNextSlotId(): number {
    return ++this.slotIdCounter;
  }

  private async seedInitialData() {
    try {
      // Check if specializations exist
      const specializationCount = await Specialization.countDocuments();
      
      if (specializationCount === 0) {
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
      const adminExists = await User.findOne({ username: "admin" });
      
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
  
  // Helper functions to convert between Mongoose and app types
  private convertUserToType(user: IUser): UserType {
    return {
      id: parseInt(user._id.toString()),
      username: user.username,
      password: user.password,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    };
  }
  
  private convertDoctorProfileToType(profile: IDoctorProfile): DoctorProfileType {
    return {
      id: parseInt(profile._id.toString()),
      userId: parseInt(profile.userId.toString()),
      specialization: profile.specialization,
      hospital: profile.hospital,
      location: profile.location,
      fee: profile.fee,
      experience: profile.experience,
      about: profile.about || null,
      status: profile.status,
      rating: profile.rating || null,
      reviewCount: profile.reviewCount || 0,
      profileImageUrl: profile.profileImageUrl || null,
      officeImageUrl: profile.officeImageUrl || null
    };
  }
  
  private convertAvailabilitySlotToType(slot: IAvailabilitySlot): AvailabilitySlotType {
    return {
      id: parseInt(slot._id.toString()),
      doctorId: parseInt(slot.doctorId.toString()),
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      isBooked: slot.isBooked
    };
  }
  
  private convertAppointmentToType(appointment: IAppointment): AppointmentType {
    return {
      id: parseInt(appointment._id.toString()),
      patientId: parseInt(appointment.patientId.toString()),
      doctorId: parseInt(appointment.doctorId.toString()),
      slotId: parseInt(appointment.slotId.toString()),
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      reason: appointment.reason || null,
      createdAt: appointment.createdAt
    };
  }
  
  private convertSpecializationToType(specialization: ISpecialization): SpecializationType {
    return {
      id: parseInt(specialization._id.toString()),
      name: specialization.name
    };
  }
  
  // User operations
  async getUser(id: number): Promise<UserType | undefined> {
    try {
      const user = await User.findById(id);
      return user ? this.convertUserToType(user) : undefined;
    } catch (error) {
      console.error(`Error getting user with id ${id}:`, error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? this.convertUserToType(user) : undefined;
    } catch (error) {
      console.error(`Error getting user with username ${username}:`, error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email });
      return user ? this.convertUserToType(user) : undefined;
    } catch (error) {
      console.error(`Error getting user with email ${email}:`, error);
      return undefined;
    }
  }
  
  async createUser(userData: InsertUser): Promise<UserType> {
    try {
      const newUser = new User(userData);
      const savedUser = await newUser.save();
      return this.convertUserToType(savedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUser(id: number, userData: Partial<UserType>): Promise<UserType | undefined> {
    try {
      const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
      return updatedUser ? this.convertUserToType(updatedUser) : undefined;
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      return undefined;
    }
  }
  
  // Doctor profile operations
  async getDoctorProfile(id: number): Promise<DoctorProfileType | undefined> {
    try {
      const profile = await DoctorProfile.findById(id);
      return profile ? this.convertDoctorProfileToType(profile) : undefined;
    } catch (error) {
      console.error(`Error getting doctor profile with id ${id}:`, error);
      return undefined;
    }
  }
  
  async getDoctorProfileByUserId(userId: number): Promise<DoctorProfileType | undefined> {
    try {
      const profile = await DoctorProfile.findOne({ userId });
      return profile ? this.convertDoctorProfileToType(profile) : undefined;
    } catch (error) {
      console.error(`Error getting doctor profile for user ${userId}:`, error);
      return undefined;
    }
  }
  
  async createDoctorProfile(profileData: InsertDoctorProfile): Promise<DoctorProfileType> {
    try {
      const newProfile = new DoctorProfile({
        ...profileData,
        rating: 0,
        reviewCount: 0
      });
      const savedProfile = await newProfile.save();
      return this.convertDoctorProfileToType(savedProfile);
    } catch (error) {
      console.error('Error creating doctor profile:', error);
      throw error;
    }
  }
  
  async updateDoctorProfile(id: number, profileData: Partial<DoctorProfileType>): Promise<DoctorProfileType | undefined> {
    try {
      const updatedProfile = await DoctorProfile.findByIdAndUpdate(id, profileData, { new: true });
      return updatedProfile ? this.convertDoctorProfileToType(updatedProfile) : undefined;
    } catch (error) {
      console.error(`Error updating doctor profile with id ${id}:`, error);
      return undefined;
    }
  }
  
  async getAllDoctors(status?: DoctorStatus): Promise<Array<UserType & { profile: DoctorProfileType }>> {
    try {
      const query = status ? { status } : {};
      const profiles = await DoctorProfile.find(query);
      
      const result: Array<UserType & { profile: DoctorProfileType }> = [];
      
      for (const profile of profiles) {
        const user = await User.findById(profile.userId);
        if (user) {
          result.push({
            ...this.convertUserToType(user),
            profile: this.convertDoctorProfileToType(profile)
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting all doctors:', error);
      return [];
    }
  }
  
  async getDoctorsBySpecialization(specialization: string): Promise<Array<UserType & { profile: DoctorProfileType }>> {
    try {
      const profiles = await DoctorProfile.find({ 
        specialization,
        status: DoctorStatus.APPROVED
      });
      
      const result: Array<UserType & { profile: DoctorProfileType }> = [];
      
      for (const profile of profiles) {
        const user = await User.findById(profile.userId);
        if (user) {
          result.push({
            ...this.convertUserToType(user),
            profile: this.convertDoctorProfileToType(profile)
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting doctors by specialization ${specialization}:`, error);
      return [];
    }
  }
  
  // Availability slots operations
  async getAvailabilitySlot(id: number): Promise<AvailabilitySlotType | undefined> {
    try {
      const slot = await AvailabilitySlot.findById(id);
      return slot ? this.convertAvailabilitySlotToType(slot) : undefined;
    } catch (error) {
      console.error(`Error getting availability slot with id ${id}:`, error);
      return undefined;
    }
  }
  
  async createAvailabilitySlot(slotData: InsertAvailabilitySlot): Promise<AvailabilitySlotType> {
    try {
      const newSlot = new AvailabilitySlot({
        ...slotData,
        isBooked: false
      });
      const savedSlot = await newSlot.save();
      return this.convertAvailabilitySlotToType(savedSlot);
    } catch (error) {
      console.error('Error creating availability slot:', error);
      throw error;
    }
  }
  
  async updateAvailabilitySlot(id: number, slotData: Partial<AvailabilitySlotType>): Promise<AvailabilitySlotType | undefined> {
    try {
      const updatedSlot = await AvailabilitySlot.findByIdAndUpdate(id, slotData, { new: true });
      return updatedSlot ? this.convertAvailabilitySlotToType(updatedSlot) : undefined;
    } catch (error) {
      console.error(`Error updating availability slot with id ${id}:`, error);
      return undefined;
    }
  }
  
  async getDoctorAvailability(doctorId: number): Promise<AvailabilitySlotType[]> {
    try {
      const slots = await AvailabilitySlot.find({ doctorId });
      return slots.map(slot => this.convertAvailabilitySlotToType(slot));
    } catch (error) {
      console.error(`Error getting availability for doctor ${doctorId}:`, error);
      return [];
    }
  }
  
  async getAvailableSlotsForDoctor(doctorId: number, date?: string): Promise<AvailabilitySlotType[]> {
    try {
      const query: any = { doctorId, isBooked: false };
      
      if (date) {
        query.date = date;
      }
      
      const slots = await AvailabilitySlot.find(query);
      return slots.map(slot => this.convertAvailabilitySlotToType(slot));
    } catch (error) {
      console.error(`Error getting available slots for doctor ${doctorId}:`, error);
      return [];
    }
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<AppointmentType | undefined> {
    try {
      const appointment = await Appointment.findById(id);
      return appointment ? this.convertAppointmentToType(appointment) : undefined;
    } catch (error) {
      console.error(`Error getting appointment with id ${id}:`, error);
      return undefined;
    }
  }
  
  async createAppointment(appointmentData: InsertAppointment): Promise<AppointmentType> {
    try {
      const newAppointment = new Appointment(appointmentData);
      const savedAppointment = await newAppointment.save();
      
      // Mark the slot as booked
      await AvailabilitySlot.findByIdAndUpdate(appointmentData.slotId, { isBooked: true });
      
      return this.convertAppointmentToType(savedAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }
  
  async updateAppointment(id: number, appointmentData: Partial<AppointmentType>): Promise<AppointmentType | undefined> {
    try {
      const appointment = await Appointment.findById(id);
      if (!appointment) return undefined;
      
      const updatedAppointment = await Appointment.findByIdAndUpdate(id, appointmentData, { new: true });
      
      // If appointment is cancelled, make the slot available again
      if (appointmentData.status === AppointmentStatus.CANCELLED) {
        await AvailabilitySlot.findByIdAndUpdate(appointment.slotId, { isBooked: false });
      }
      
      return updatedAppointment ? this.convertAppointmentToType(updatedAppointment) : undefined;
    } catch (error) {
      console.error(`Error updating appointment with id ${id}:`, error);
      return undefined;
    }
  }
  
  async getPatientAppointments(patientId: number, status?: AppointmentStatus): Promise<Array<AppointmentType & { doctor: UserType & { profile: DoctorProfileType } }>> {
    try {
      const query: any = { patientId };
      
      if (status) {
        query.status = status;
      }
      
      const appointments = await Appointment.find(query);
      const result: Array<AppointmentType & { doctor: UserType & { profile: DoctorProfileType } }> = [];
      
      for (const appointment of appointments) {
        const doctorProfile = await DoctorProfile.findById(appointment.doctorId);
        if (!doctorProfile) continue;
        
        const doctor = await User.findById(doctorProfile.userId);
        if (!doctor) continue;
        
        result.push({
          ...this.convertAppointmentToType(appointment),
          doctor: {
            ...this.convertUserToType(doctor),
            profile: this.convertDoctorProfileToType(doctorProfile)
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting appointments for patient ${patientId}:`, error);
      return [];
    }
  }
  
  async getDoctorAppointments(doctorId: number, status?: AppointmentStatus): Promise<Array<AppointmentType & { patient: UserType }>> {
    try {
      const query: any = { doctorId };
      
      if (status) {
        query.status = status;
      }
      
      const appointments = await Appointment.find(query);
      const result: Array<AppointmentType & { patient: UserType }> = [];
      
      for (const appointment of appointments) {
        const patient = await User.findById(appointment.patientId);
        if (!patient) continue;
        
        result.push({
          ...this.convertAppointmentToType(appointment),
          patient: this.convertUserToType(patient)
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting appointments for doctor ${doctorId}:`, error);
      return [];
    }
  }
  
  async getAllAppointments(): Promise<Array<AppointmentType & { doctor: UserType & { profile: DoctorProfileType }, patient: UserType }>> {
    try {
      const appointments = await Appointment.find();
      const result: Array<AppointmentType & { doctor: UserType & { profile: DoctorProfileType }, patient: UserType }> = [];
      
      for (const appointment of appointments) {
        const doctorProfile = await DoctorProfile.findById(appointment.doctorId);
        if (!doctorProfile) continue;
        
        const doctor = await User.findById(doctorProfile.userId);
        if (!doctor) continue;
        
        const patient = await User.findById(appointment.patientId);
        if (!patient) continue;
        
        result.push({
          ...this.convertAppointmentToType(appointment),
          doctor: {
            ...this.convertUserToType(doctor),
            profile: this.convertDoctorProfileToType(doctorProfile)
          },
          patient: this.convertUserToType(patient)
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting all appointments:', error);
      return [];
    }
  }
  
  // Specialization operations
  async getAllSpecializations(): Promise<SpecializationType[]> {
    try {
      const specializations = await Specialization.find();
      return specializations.map(spec => this.convertSpecializationToType(spec));
    } catch (error) {
      console.error('Error getting all specializations:', error);
      return [];
    }
  }
  
  async createSpecialization(specializationData: InsertSpecialization): Promise<SpecializationType> {
    try {
      const newSpecialization = new Specialization(specializationData);
      const savedSpecialization = await newSpecialization.save();
      return this.convertSpecializationToType(savedSpecialization);
    } catch (error) {
      console.error('Error creating specialization:', error);
      throw error;
    }
  }
  
  // Admin operations
  async getAllUsers(): Promise<UserType[]> {
    try {
      const users = await User.find();
      return users.map(user => this.convertUserToType(user));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
  
  async getUsersByRole(role: UserRole): Promise<UserType[]> {
    try {
      const users = await User.find({ role });
      return users.map(user => this.convertUserToType(user));
    } catch (error) {
      console.error(`Error getting users with role ${role}:`, error);
      return [];
    }
  }
}

// Create and export an instance of MongoStorage
export const storage = new MongoStorage();