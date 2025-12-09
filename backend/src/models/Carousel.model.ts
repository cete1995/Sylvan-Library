import mongoose, { Document, Schema } from 'mongoose';

export interface ICarousel extends Document {
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const carouselSchema = new Schema<ICarousel>(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    altText: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      required: true,
      min: 0,
      max: 7,
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
carouselSchema.index({ order: 1, isActive: 1 });

const Carousel = mongoose.model<ICarousel>('Carousel', carouselSchema);

export default Carousel;
