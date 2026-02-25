import mongoose, { Document, Schema } from 'mongoose';

export interface IOfflineBuyItem {
  cardId: mongoose.Types.ObjectId;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  condition: string;
  finish: string;
  inventoryIndex: number; // index in card.inventory after adding/incrementing
  quantity: number;
  pricePerUnit: number; // buy price (what we paid)
  subtotal: number;
  destinationSellerId: string;
  destinationSellerName: string;
}

export interface IOfflineBuy extends Document {
  buyNumber: string;
  memberName: string;       // person selling to us
  memberId?: string;        // optional registered member/user id
  destinationSellerId: string;   // seller whose inventory gets incremented
  destinationSellerName: string;
  items: IOfflineBuyItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'store-credit' | 'other';
  notes?: string;
  status: 'completed' | 'voided';
  createdAt: Date;
  updatedAt: Date;
}

const offlineBuyItemSchema = new Schema<IOfflineBuyItem>(
  {
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    cardName: { type: String, required: true },
    setCode: { type: String, required: true },
    setName: { type: String, required: true },
    collectorNumber: { type: String, required: true },
    imageUrl: { type: String },
    condition: { type: String, required: true },
    finish: { type: String, required: true },
    inventoryIndex: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    destinationSellerId: { type: String, required: true },
    destinationSellerName: { type: String, required: true },
  },
  { _id: false }
);

const offlineBuySchema = new Schema<IOfflineBuy>(
  {
    buyNumber: { type: String, required: true, unique: true },
    memberName: { type: String, required: true, trim: true },
    memberId: { type: String },
    destinationSellerId: { type: String, required: true, index: true },
    destinationSellerName: { type: String, required: true },
    items: {
      type: [offlineBuyItemSchema],
      required: true,
      validate: {
        validator: (items: IOfflineBuyItem[]) => items.length > 0,
        message: 'Buy must have at least one item',
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'transfer', 'store-credit', 'other'],
      default: 'cash',
    },
    notes: { type: String },
    status: {
      type: String,
      enum: ['completed', 'voided'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

offlineBuySchema.index({ createdAt: -1 });
offlineBuySchema.index({ memberName: 1 });

// Auto-generate buy number
offlineBuySchema.pre('validate', async function (next) {
  if (!this.buyNumber) {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const count = await OfflineBuy.countDocuments({ createdAt: { $gte: startOfDay } });
    this.buyNumber = `BUY-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

const OfflineBuy = mongoose.model<IOfflineBuy>('OfflineBuy', offlineBuySchema);
export default OfflineBuy;
