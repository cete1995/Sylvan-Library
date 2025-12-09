import mongoose, { Document, Schema } from 'mongoose';

export interface IFeaturedBanner extends Document {
  imageUrl: string;
  title: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const featuredBannerSchema = new Schema<IFeaturedBanner>(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    buttonText: {
      type: String,
      required: [true, 'Button text is required'],
      trim: true,
      default: 'Click for More',
    },
    buttonLink: {
      type: String,
      required: [true, 'Button link is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const FeaturedBanner = mongoose.model<IFeaturedBanner>('FeaturedBanner', featuredBannerSchema);

export default FeaturedBanner;
