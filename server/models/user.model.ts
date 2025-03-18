import mongoose, { Document, Model, Schema } from 'mongoose';
import { UserRole } from '@shared/schema';

// Define interface for User document
export interface IUser extends Document {
  id: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

// Create schema
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.PATIENT,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export model
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);