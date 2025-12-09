import mongoose, { Document, Schema } from 'mongoose';

export interface IFeaturedProduct extends Document {
  cardId: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const featuredProductSchema = new Schema<IFeaturedProduct>(
  {
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: [true, 'Card ID is required'],
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for ordering
featuredProductSchema.index({ order: 1, isActive: 1 });

const FeaturedProduct = mongoose.model<IFeaturedProduct>('FeaturedProduct', featuredProductSchema);

export default FeaturedProduct;
