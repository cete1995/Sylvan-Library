import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  cards: mongoose.Types.ObjectId[];
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
  },
  { timestamps: true }
);

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
