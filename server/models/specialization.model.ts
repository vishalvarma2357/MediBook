import mongoose, { Document, Model, Schema } from 'mongoose';

// Define interface for Specialization document
export interface ISpecialization extends Document {
  name: string;
}

// Create schema
const SpecializationSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

// Create and export model
export const Specialization: Model<ISpecialization> = mongoose.model<ISpecialization>('Specialization', SpecializationSchema);