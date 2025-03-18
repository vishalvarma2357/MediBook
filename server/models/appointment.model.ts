import mongoose, { Document, Model, Schema } from 'mongoose';
import { AppointmentStatus } from '@shared/schema';
import { IUser } from './user.model';
import { IDoctorProfile } from './doctor-profile.model';
import { IAvailabilitySlot } from './availability-slot.model';

// Define interface for Appointment document
export interface IAppointment extends Document {
  patientId: IUser['_id'];
  doctorId: IDoctorProfile['_id'];
  slotId: IAvailabilitySlot['_id'];
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM (24h)
  endTime: string; // Format: HH:MM (24h)
  status: AppointmentStatus;
  reason?: string;
  createdAt: Date;
}

// Create schema
const AppointmentSchema: Schema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'DoctorProfile',
    required: true,
  },
  slotId: {
    type: Schema.Types.ObjectId,
    ref: 'AvailabilitySlot',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PENDING,
    required: true,
  },
  reason: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export model
export const Appointment: Model<IAppointment> = mongoose.model<IAppointment>('Appointment', AppointmentSchema);