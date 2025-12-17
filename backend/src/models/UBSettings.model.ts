import mongoose, { Document, Schema } from 'mongoose';

export interface IUBSettings extends Document {
  ubSets: string[];
  multiplierUnder5: number;
  multiplier5AndAbove: number;
  createdAt: Date;
  updatedAt: Date;
}

const ubSettingsSchema = new Schema<IUBSettings>(
  {
    ubSets: {
      type: [String],
      default: [
        "40K", "BOT", "LTR", "LTC", "WHO", "REX", "PIP", "ACR", 
        "FIN", "FCA", "FIC", "MAR", "SPE", "SPM", "TLA", "TLE", 
        "PZA", "TMC", "TMT"
      ],
      required: true,
    },
    multiplierUnder5: {
      type: Number,
      default: 20000,
      required: true,
    },
    multiplier5AndAbove: {
      type: Number,
      default: 15000,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUBSettings>('UBSettings', ubSettingsSchema);
