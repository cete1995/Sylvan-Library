import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  card: mongoose.Types.ObjectId;
  cardName: string;
  condition: string;
  finish: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  phoneNumber: string;
  courierNotes?: string;
  paymentMethod?: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  card: {
    type: Schema.Types.ObjectId,
    ref: 'Card',
    required: true,
  },
  cardName: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    required: true,
  },
  finish: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      required: true,
      index: true,
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    courierNotes: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster user order lookups
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
