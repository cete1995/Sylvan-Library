import mongoose, { Schema, Document } from 'mongoose';

export interface ICardPrice extends Document {
  uuid: string;
  date: Date;
  prices: {
    cardkingdom?: {
      retail?: {
        normal?: number;
        foil?: number;
      };
    };
    tcgplayer?: {
      retail?: {
        normal?: number;
        foil?: number;
      };
    };
  };
  createdAt: Date;
}

const CardPriceSchema = new Schema<ICardPrice>({
  uuid: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  prices: {
    cardkingdom: {
      retail: {
        normal: Number,
        foil: Number
      }
    },
    tcgplayer: {
      retail: {
        normal: Number,
        foil: Number
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient querying
CardPriceSchema.index({ uuid: 1, date: -1 });

export default mongoose.model<ICardPrice>('CardPrice', CardPriceSchema);
