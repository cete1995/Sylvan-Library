import mongoose, { Document, Schema } from 'mongoose';

export interface IStockNotification extends Document {
  user: mongoose.Types.ObjectId;
  card: mongoose.Types.ObjectId;
  createdAt: Date;
}

const stockNotificationSchema = new Schema<IStockNotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    card: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockNotificationSchema.index({ user: 1, card: 1 }, { unique: true });

export default mongoose.model<IStockNotification>('StockNotification', stockNotificationSchema);
