import { 
  User, InsertUser, 
  DoctorProfile, InsertDoctorProfile, 
  Appointment, InsertAppointment,
  AvailabilitySlot, InsertAvailabilitySlot,
  Specialization, InsertSpecialization,
  UserRole, AppointmentStatus, DoctorStatus
} from "@shared/schema";
import session from "express-session";
import { IStorage } from "./storage";
import { db, pool, pgSessionStore } from "./db-pg";
import { eq, and, desc, asc } from "drizzle-orm";
import { users, doctorProfiles, availabilitySlots, appointments, specializations } from "@shared/schema";

export class PostgresStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create session store
    this.sessionStore = pgSessionStore({
      secret: process.env.SESSION_SECRET || 'medibook-secret-key'
    });
    
    // Initialize with sample data
    this.seedInitialData();
  }
  
  private async seedInitialData() {
    try {
      // Seed specializations
      const existingSpecializations = await db.select().from(specializations);
      
      if (existingSpecializations.length === 0) {
        console.log('[database] Seeding specializations...');
        await db.insert(specializations).values([
          { name: 'Cardiology' },
          { name: 'Neurology' },
          { name: 'Dermatology' },
          { name: 'Pediatrics' },
          { name: 'Orthopedics' },
          { name: 'Ophthalmology' },
          { name: 'Gynecology' },
          { name: 'Dentistry' }
        ]);
        console.log('[database] Specializations seeded successfully');
      }
      
      // Seed admin user
      const existingAdmin = await db.select().from(users).where(eq(users.role, UserRole.ADMIN));
      
      if (existingAdmin.length === 0) {
        console.log('[database] Seeding admin user...');
        await db.insert(users).values({
          username: 'admin',
          password: '5ed28fa5e348d7d25114f9599bdb5f48ff9b2281f7f04c557db1c91fc78faf27.4fdd94faaad7282e6414d295cab9823d', // admin123
          email: 'admin@medibook.com',
          firstName: 'System',
          lastName: 'Admin',
          role: UserRole.ADMIN
        });
        console.log('[database] Admin user seeded successfully');
      }
      
      // Seed some doctors and availability slots
      const existingDoctors = await db.select().from(users).where(eq(users.role, UserRole.DOCTOR));
      
      if (existingDoctors.length === 0) {
        console.log('[database] Seeding doctor data...');
        
        // Create doctor users
        const doctors = [
          {
            username: 'dr.smith',
            password: '5ed28fa5e348d7d25114f9599bdb5f48ff9b2281f7f04c557db1c91fc78faf27.4fdd94faaad7282e6414d295cab9823d', // admin123
            email: 'smith@medibook.com',
            firstName: 'John',
            lastName: 'Smith',
            role: UserRole.DOCTOR
          },
          {
            username: 'dr.patel',
            password: '5ed28fa5e348d7d25114f9599bdb5f48ff9b2281f7f04c557db1c91fc78faf27.4fdd94faaad7282e6414d295cab9823d', // admin123
            email: 'patel@medibook.com',
            firstName: 'Priya',
            lastName: 'Patel',
            role: UserRole.DOCTOR
          }
        ];
        
        for (const doctor of doctors) {
          const [newDoctor] = await db.insert(users).values(doctor).returning();
          
          // Create doctor profile
          const [newProfile] = await db.insert(doctorProfiles).values({
            userId: newDoctor.id,
            specialization: doctor.username === 'dr.smith' ? 'Cardiology' : 'Neurology',
            hospital: doctor.username === 'dr.smith' ? 'Central Hospital' : 'City Medical Center',
            location: doctor.username === 'dr.smith' ? 'New York' : 'Chicago',
            fee: doctor.username === 'dr.smith' ? 150 : 180,
            experience: doctor.username === 'dr.smith' ? 10 : 8,
            about: `Dr. ${doctor.lastName} is a highly skilled specialist with extensive experience.`,
            status: DoctorStatus.APPROVED,
            rating: doctor.username === 'dr.smith' ? 4 : 5,
            reviewCount: doctor.username === 'dr.smith' ? 42 : 27
          }).returning();
          
          // Create availability slots for next 7 days
          const today = new Date();
          for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Morning slots
            await db.insert(availabilitySlots).values({
              doctorId: newProfile.id,
              date: dateStr,
              startTime: '09:00',
              endTime: '09:30',
              duration: 30,
              isBooked: false
            });
            
            await db.insert(availabilitySlots).values({
              doctorId: newProfile.id,
              date: dateStr,
              startTime: '09:30',
              endTime: '10:00',
              duration: 30,
              isBooked: false
            });
            
            // Afternoon slots
            await db.insert(availabilitySlots).values({
              doctorId: newProfile.id,
              date: dateStr,
              startTime: '14:00',
              endTime: '14:30',
              duration: 30,
              isBooked: false
            });
            
            await db.insert(availabilitySlots).values({
              doctorId: newProfile.id,
              date: dateStr,
              startTime: '14:30',
              endTime: '15:00',
              duration: 30,
              isBooked: false
            });
          }
        }
        
        console.log('[database] Doctor data and availability slots seeded successfully');
      }
    } catch (error) {
      console.error('[database] Error seeding data:', error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Doctor profile operations
  async getDoctorProfile(id: number): Promise<DoctorProfile | undefined> {
    const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, id));
    return profile;
  }

  async getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined> {
    const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));
    return profile;
  }

  async createDoctorProfile(profileData: InsertDoctorProfile): Promise<DoctorProfile> {
    const [newProfile] = await db.insert(doctorProfiles).values(profileData).returning();
    return newProfile;
  }

  async updateDoctorProfile(id: number, profileData: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
    const [updatedProfile] = await db.update(doctorProfiles)
      .set(profileData)
      .where(eq(doctorProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  async getAllDoctors(status?: DoctorStatus): Promise<Array<User & { profile: DoctorProfile }>> {
    const result: Array<User & { profile: DoctorProfile }> = [];
    
    // Get all doctor profiles matching the status if provided
    const profiles = status 
      ? await db.select().from(doctorProfiles).where(eq(doctorProfiles.status, status))
      : await db.select().from(doctorProfiles);
    
    // For each profile, get the user data
    for (const profile of profiles) {
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        result.push({ ...user, profile });
      }
    }
    
    return result;
  }

  async getDoctorsBySpecialization(specialization: string): Promise<Array<User & { profile: DoctorProfile }>> {
    const result: Array<User & { profile: DoctorProfile }> = [];
    
    // Get all approved doctor profiles with the given specialization
    const profiles = await db.select().from(doctorProfiles).where(
      and(
        eq(doctorProfiles.specialization, specialization),
        eq(doctorProfiles.status, DoctorStatus.APPROVED)
      )
    );
    
    // For each profile, get the user data
    for (const profile of profiles) {
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        result.push({ ...user, profile });
      }
    }
    
    return result;
  }

  // Availability slots operations
  async getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined> {
    const [slot] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, id));
    return slot;
  }

  async createAvailabilitySlot(slotData: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const [newSlot] = await db.insert(availabilitySlots).values(slotData).returning();
    return newSlot;
  }

  async updateAvailabilitySlot(id: number, slotData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot | undefined> {
    const [updatedSlot] = await db.update(availabilitySlots)
      .set(slotData)
      .where(eq(availabilitySlots.id, id))
      .returning();
    return updatedSlot;
  }

  async getDoctorAvailability(doctorId: number): Promise<AvailabilitySlot[]> {
    return db.select().from(availabilitySlots).where(eq(availabilitySlots.doctorId, doctorId));
  }

  async getAvailableSlotsForDoctor(doctorId: number, date?: string): Promise<AvailabilitySlot[]> {
    if (date) {
      return db.select().from(availabilitySlots).where(
        and(
          eq(availabilitySlots.doctorId, doctorId),
          eq(availabilitySlots.date, date),
          eq(availabilitySlots.isBooked, false)
        )
      );
    }
    
    // If no date is provided, get all available slots
    return db.select().from(availabilitySlots).where(
      and(
        eq(availabilitySlots.doctorId, doctorId),
        eq(availabilitySlots.isBooked, false)
      )
    );
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    // Mark the slot as booked
    await db.update(availabilitySlots)
      .set({ isBooked: true })
      .where(eq(availabilitySlots.id, appointmentData.slotId));
    
    // Create the appointment
    const [newAppointment] = await db.insert(appointments).values(appointmentData).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db.update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async getPatientAppointments(patientId: number, status?: AppointmentStatus): Promise<Array<Appointment & { doctor: User & { profile: DoctorProfile } }>> {
    const result: Array<Appointment & { doctor: User & { profile: DoctorProfile } }> = [];
    
    // Get appointments for the patient
    const patientAppointments = status
      ? await db.select().from(appointments).where(
          and(
            eq(appointments.patientId, patientId),
            eq(appointments.status, status)
          )
        ).orderBy(desc(appointments.date), asc(appointments.startTime))
      : await db.select().from(appointments).where(
          eq(appointments.patientId, patientId)
        ).orderBy(desc(appointments.date), asc(appointments.startTime));
    
    // For each appointment, get the doctor and profile data
    for (const appointment of patientAppointments) {
      const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, appointment.doctorId));
      if (profile) {
        const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
        if (user) {
          result.push({
            ...appointment,
            doctor: { ...user, profile }
          });
        }
      }
    }
    
    return result;
  }

  async getDoctorAppointments(doctorId: number, status?: AppointmentStatus): Promise<Array<Appointment & { patient: User }>> {
    const result: Array<Appointment & { patient: User }> = [];
    
    // Get appointments for the doctor
    const doctorAppointments = status
      ? await db.select().from(appointments).where(
          and(
            eq(appointments.doctorId, doctorId),
            eq(appointments.status, status)
          )
        ).orderBy(desc(appointments.date), asc(appointments.startTime))
      : await db.select().from(appointments).where(
          eq(appointments.doctorId, doctorId)
        ).orderBy(desc(appointments.date), asc(appointments.startTime));
    
    // For each appointment, get the patient data
    for (const appointment of doctorAppointments) {
      const [patient] = await db.select().from(users).where(eq(users.id, appointment.patientId));
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
    
    // Get all appointments
    const allAppointments = await db.select().from(appointments)
      .orderBy(desc(appointments.date), asc(appointments.startTime));
    
    // For each appointment, get the doctor, profile, and patient data
    for (const appointment of allAppointments) {
      const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, appointment.doctorId));
      const [patient] = await db.select().from(users).where(eq(users.id, appointment.patientId));
      
      if (profile && patient) {
        const [doctor] = await db.select().from(users).where(eq(users.id, profile.userId));
        
        if (doctor) {
          result.push({
            ...appointment,
            doctor: { ...doctor, profile },
            patient
          });
        }
      }
    }
    
    return result;
  }

  // Specialization operations
  async getAllSpecializations(): Promise<Specialization[]> {
    return db.select().from(specializations);
  }

  async createSpecialization(specializationData: InsertSpecialization): Promise<Specialization> {
    const [newSpecialization] = await db.insert(specializations).values(specializationData).returning();
    return newSpecialization;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }
}