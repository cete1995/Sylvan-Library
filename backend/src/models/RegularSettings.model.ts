import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceTier {
  maxPrice: number; // Cards <= this price use this multiplier (null for highest tier)
  multiplier: number;
}

export interface IRegularSettings extends Document {
  priceTiers: IPriceTier[];
  createdAt: Date;
  updatedAt: Date;
}

const priceTierSchema = new Schema<IPriceTier>({
  maxPrice: {
    type: Number,
    required: true,
  },
  multiplier: {
    type: Number,
    required: true,
  },
}, { _id: false });

const regularSettingsSchema = new Schema<IRegularSettings>(
  {
    priceTiers: {
      type: [priceTierSchema],
      default: [
        { maxPrice: 5, multiplier: 20000 },
        { maxPrice: 999999, multiplier: 15000 } // Highest tier (effectively "and above")
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRegularSettings>('RegularSettings', regularSettingsSchema);
