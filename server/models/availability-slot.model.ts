import mongoose, { Document, Model, Schema } from 'mongoose';
import { IDoctorProfile } from './doctor-profile.model';

// Define interface for Availability Slot document
export interface IAvailabilitySlot extends Document {
  doctorId: IDoctorProfile['_id'];
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:MM (24h)
  endTime: string; // Format: HH:MM (24h)
  duration: number; // in minutes
  isBooked: boolean;
}

// Create schema
const AvailabilitySlotSchema: Schema = new Schema({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'DoctorProfile',
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
  duration: {
    type: Number,
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
});

// Create and export model
export const AvailabilitySlot: Model<IAvailabilitySlot> = mongoose.model<IAvailabilitySlot>('AvailabilitySlot', AvailabilitySlotSchema);