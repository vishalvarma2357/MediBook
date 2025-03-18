import mongoose, { Document, Model, Schema } from 'mongoose';
import { DoctorStatus } from '@shared/schema';
import { IUser } from './user.model';

// Define interface for Doctor Profile document
export interface IDoctorProfile extends Document {
  userId: IUser['_id'];
  specialization: string;
  hospital: string;
  location: string;
  fee: number;
  experience: number;
  about?: string;
  status: DoctorStatus;
  rating?: number;
  reviewCount: number;
  profileImageUrl?: string;
  officeImageUrl?: string;
}

// Create schema
const DoctorProfileSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  hospital: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  fee: {
    type: Number,
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  about: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(DoctorStatus),
    default: DoctorStatus.PENDING,
    required: true,
  },
  rating: {
    type: Number,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  profileImageUrl: {
    type: String,
  },
  officeImageUrl: {
    type: String,
  },
});

// Create and export model
export const DoctorProfile: Model<IDoctorProfile> = mongoose.model<IDoctorProfile>('DoctorProfile', DoctorProfileSchema);