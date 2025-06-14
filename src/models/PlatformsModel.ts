import { Schema, Document, Types, model } from 'mongoose';
import { platformsConstants } from '../constants';

const { PLATFORMS } = platformsConstants;

// 1. Define the TypeScript interface for the document
export interface IPlatform extends Document {
  type: string;
  name: string;
  email: string;
  tokens: Record<string, any>; // or a more specific type if known
  connectorId?: Types.ObjectId; // Optional field
  cloudId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Create the schema
const platformsSchema = new Schema<IPlatform>(
  {
    type: {
      type: String,
      enum: Object.values(PLATFORMS).map(platform => platform.value),
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    tokens: { type: Object, required: true },
    cloudId: { type: String, required: false },
    connectorId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

// 3. Export the model with types
export default model<IPlatform>('Platforms', platformsSchema);
