import { users, doctors, timeSlots, appointments, specialties, User, Doctor, TimeSlot, Appointment, Specialty, InsertUser, InsertDoctor, InsertTimeSlot, InsertAppointment, InsertSpecialty, DoctorWithUser, AppointmentWithDetails } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Doctor operations
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctorByUserId(userId: number): Promise<Doctor | undefined>;
  getDoctorById(id: number): Promise<DoctorWithUser | undefined>;
  getAllDoctors(): Promise<DoctorWithUser[]>;
  getDoctorsBySpecialty(specialty: string): Promise<DoctorWithUser[]>;
  updateDoctor(id: number, doctor: Partial<Doctor>): Promise<Doctor | undefined>;
  
  // TimeSlot operations
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  getTimeSlotById(id: number): Promise<TimeSlot | undefined>;
  getTimeSlotsByDoctorId(doctorId: number): Promise<TimeSlot[]>;
  getAvailableTimeSlotsByDoctorId(doctorId: number): Promise<TimeSlot[]>;
  updateTimeSlot(id: number, timeSlot: Partial<TimeSlot>): Promise<TimeSlot | undefined>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentById(id: number): Promise<AppointmentWithDetails | undefined>;
  getAppointmentsByPatientId(patientId: number): Promise<AppointmentWithDetails[]>;
  getAppointmentsByDoctorId(doctorId: number): Promise<AppointmentWithDetails[]>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  
  // Specialty operations
  createSpecialty(specialty: InsertSpecialty): Promise<Specialty>;
  getAllSpecialties(): Promise<Specialty[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private timeSlots: Map<number, TimeSlot>;
  private appointments: Map<number, Appointment>;
  private specialties: Map<number, Specialty>;
  public sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private doctorCurrentId: number;
  private timeSlotCurrentId: number;
  private appointmentCurrentId: number;
  private specialtyCurrentId: number;

  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.timeSlots = new Map();
    this.appointments = new Map();
    this.specialties = new Map();
    
    this.userCurrentId = 1;
    this.doctorCurrentId = 1;
    this.timeSlotCurrentId = 1;
    this.appointmentCurrentId = 1;
    this.specialtyCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with admin user
    this.createUser({
      name: "Admin User",
      email: "admin@medibook.com",
      password: "password123",
      role: "admin",
      approved: true
    });
    
    // Initialize specialties
    const specialtyNames = [
      "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology", 
      "Neurology", "Obstetrics", "Oncology", "Ophthalmology", 
      "Orthopedics", "Pediatrics", "Psychiatry", "Urology"
    ];
    
    specialtyNames.forEach(name => {
      this.createSpecialty({ name });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }

  // Doctor operations
  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = this.doctorCurrentId++;
    const doctor: Doctor = { ...insertDoctor, id };
    this.doctors.set(id, doctor);
    return doctor;
  }

  async getDoctorByUserId(userId: number): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(
      (doctor) => doctor.userId === userId
    );
  }

  async getDoctorById(id: number): Promise<DoctorWithUser | undefined> {
    const doctor = this.doctors.get(id);
    if (!doctor) return undefined;
    
    const user = await this.getUser(doctor.userId);
    if (!user) return undefined;
    
    return { ...doctor, user };
  }

  async getAllDoctors(): Promise<DoctorWithUser[]> {
    const doctors = Array.from(this.doctors.values());
    const result: DoctorWithUser[] = [];
    
    for (const doctor of doctors) {
      const user = await this.getUser(doctor.userId);
      if (user && user.approved) {
        result.push({ ...doctor, user });
      }
    }
    
    return result;
  }

  async getDoctorsBySpecialty(specialty: string): Promise<DoctorWithUser[]> {
    const doctors = Array.from(this.doctors.values()).filter(
      (doctor) => doctor.specialty.toLowerCase() === specialty.toLowerCase()
    );
    
    const result: DoctorWithUser[] = [];
    
    for (const doctor of doctors) {
      const user = await this.getUser(doctor.userId);
      if (user && user.approved) {
        result.push({ ...doctor, user });
      }
    }
    
    return result;
  }

  async updateDoctor(id: number, doctorData: Partial<Doctor>): Promise<Doctor | undefined> {
    const doctor = this.doctors.get(id);
    if (!doctor) return undefined;
    
    const updatedDoctor = { ...doctor, ...doctorData };
    this.doctors.set(id, updatedDoctor);
    return updatedDoctor;
  }

  // TimeSlot operations
  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = this.timeSlotCurrentId++;
    const timeSlot: TimeSlot = { ...insertTimeSlot, id };
    this.timeSlots.set(id, timeSlot);
    return timeSlot;
  }

  async getTimeSlotById(id: number): Promise<TimeSlot | undefined> {
    return this.timeSlots.get(id);
  }

  async getTimeSlotsByDoctorId(doctorId: number): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      (timeSlot) => timeSlot.doctorId === doctorId
    );
  }

  async getAvailableTimeSlotsByDoctorId(doctorId: number): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      (timeSlot) => timeSlot.doctorId === doctorId && !timeSlot.isBooked
    );
  }

  async updateTimeSlot(id: number, timeSlotData: Partial<TimeSlot>): Promise<TimeSlot | undefined> {
    const timeSlot = this.timeSlots.get(id);
    if (!timeSlot) return undefined;
    
    const updatedTimeSlot = { ...timeSlot, ...timeSlotData };
    this.timeSlots.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }

  // Appointment operations
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentCurrentId++;
    const appointment: Appointment = { 
      ...insertAppointment, 
      id,
      createdAt: new Date()
    };
    this.appointments.set(id, appointment);
    
    // Mark the time slot as booked
    const timeSlot = await this.getTimeSlotById(appointment.timeSlotId);
    if (timeSlot) {
      await this.updateTimeSlot(timeSlot.id, { isBooked: true });
    }
    
    return appointment;
  }

  async getAppointmentById(id: number): Promise<AppointmentWithDetails | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const timeSlot = await this.getTimeSlotById(appointment.timeSlotId);
    if (!timeSlot) return undefined;
    
    const doctorWithUser = await this.getDoctorById(appointment.doctorId);
    if (!doctorWithUser) return undefined;
    
    const patient = await this.getUser(appointment.patientId);
    if (!patient) return undefined;
    
    return {
      ...appointment,
      timeSlot,
      doctor: doctorWithUser,
      patient
    };
  }

  async getAppointmentsByPatientId(patientId: number): Promise<AppointmentWithDetails[]> {
    const appointments = Array.from(this.appointments.values()).filter(
      (appointment) => appointment.patientId === patientId
    );
    
    const result: AppointmentWithDetails[] = [];
    
    for (const appointment of appointments) {
      const details = await this.getAppointmentById(appointment.id);
      if (details) {
        result.push(details);
      }
    }
    
    return result;
  }

  async getAppointmentsByDoctorId(doctorId: number): Promise<AppointmentWithDetails[]> {
    const appointments = Array.from(this.appointments.values()).filter(
      (appointment) => appointment.doctorId === doctorId
    );
    
    const result: AppointmentWithDetails[] = [];
    
    for (const appointment of appointments) {
      const details = await this.getAppointmentById(appointment.id);
      if (details) {
        result.push(details);
      }
    }
    
    return result;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    // If status is changed to cancelled, free up the time slot
    if (appointmentData.status === 'cancelled' && appointment.status !== 'cancelled') {
      const timeSlot = await this.getTimeSlotById(appointment.timeSlotId);
      if (timeSlot) {
        await this.updateTimeSlot(timeSlot.id, { isBooked: false });
      }
    }
    
    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  // Specialty operations
  async createSpecialty(insertSpecialty: InsertSpecialty): Promise<Specialty> {
    const id = this.specialtyCurrentId++;
    const specialty: Specialty = { ...insertSpecialty, id };
    this.specialties.set(id, specialty);
    return specialty;
  }

  async getAllSpecialties(): Promise<Specialty[]> {
    return Array.from(this.specialties.values());
  }
}

export const storage = new MemStorage();
