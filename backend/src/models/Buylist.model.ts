import mongoose, { Document, Schema } from 'mongoose';

export interface IBuylistItem extends Document {
  cardName: string;
  setCode?: string;
  setName?: string;
  imageUrl?: string;
  condition: 'NM' | 'LP' | 'P';
  finish: 'nonfoil' | 'foil' | 'etched';
  buyPrice: number; // price shop pays to customer (IDR)
  isActive: boolean;
  notes?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const buylistItemSchema = new Schema<IBuylistItem>(
  {
    cardName: { type: String, required: true, trim: true },
    setCode: { type: String, trim: true },
    setName: { type: String, trim: true },
    imageUrl: { type: String },
    condition: {
      type: String,
      enum: { values: ['NM', 'LP', 'P'], message: 'Condition must be NM, LP, or P' },
      required: true,
    },
    finish: {
      type: String,
      enum: { values: ['nonfoil', 'foil', 'etched'], message: 'Finish must be nonfoil, foil, or etched' },
      required: true,
    },
    buyPrice: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

buylistItemSchema.index({ isActive: 1, cardName: 1 });

export default mongoose.model<IBuylistItem>('BuylistItem', buylistItemSchema);
