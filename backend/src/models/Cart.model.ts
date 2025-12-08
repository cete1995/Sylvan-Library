import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICartItem {
  _id?: Types.ObjectId;
  card: mongoose.Types.ObjectId;
  inventoryIndex: number; // Index of the inventory item in the card's inventory array
  quantity: number;
  price: number; // Price at the time of adding to cart
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: Types.DocumentArray<ICartItem & Document>;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  card: {
    type: Schema.Types.ObjectId,
    ref: 'Card',
    required: true,
  },
  inventoryIndex: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: true });

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Index for faster user lookups
cartSchema.index({ user: 1 });

const Cart = mongoose.model<ICart>('Cart', cartSchema);

export default Cart;
