import mongoose, { Document, Schema } from 'mongoose';

export interface IOfflineSaleItem {
  cardId: mongoose.Types.ObjectId;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  condition: string;
  finish: string;
  inventoryIndex: number; // index in card.inventory array
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  sellerId: string;
  sellerName: string;
}

export interface IOfflineSale extends Document {
  saleNumber: string;
  sellerId: string;       // first seller, or 'multiple'
  sellerName: string;    // first seller name, or 'Multiple Sellers'
  sellerSummary: string; // comma-separated seller names
  customerName?: string;
  items: IOfflineSaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'other';
  notes?: string;
  status: 'completed' | 'voided';
  createdAt: Date;
  updatedAt: Date;
}

const offlineSaleItemSchema = new Schema<IOfflineSaleItem>(
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
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
  },
  { _id: false }
);

const offlineSaleSchema = new Schema<IOfflineSale>(
  {
    saleNumber: { type: String, required: true, unique: true },
    sellerId: { type: String, required: false, default: '', index: true },
    sellerName: { type: String, required: false, default: '' },
    sellerSummary: { type: String, required: false, default: '' },
    customerName: { type: String },
    items: {
      type: [offlineSaleItemSchema],
      required: true,
      validate: {
        validator: (items: IOfflineSaleItem[]) => items.length > 0,
        message: 'Sale must have at least one item',
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'transfer', 'other'],
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

offlineSaleSchema.index({ createdAt: -1 });

// Auto-generate sale number
offlineSaleSchema.pre('validate', async function (next) {
  if (!this.saleNumber) {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    // Count how many sales exist today
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const count = await OfflineSale.countDocuments({ createdAt: { $gte: startOfDay } });
    this.saleNumber = `OFFLINE-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

const OfflineSale = mongoose.model<IOfflineSale>('OfflineSale', offlineSaleSchema);
export default OfflineSale;
