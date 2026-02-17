import mongoose, { Schema, Document } from 'mongoose';

export interface ITikTokOrder extends Document {
  orderId: string;
  orderStatus: string;
  createTime: number;
  updateTime: number;
  buyerUserId?: string;
  shippingType?: string;
  payment?: {
    currency: string;
    subTotal: number;
    shippingFee: number;
    platformDiscount: number;
    sellerDiscount: number;
    totalAmount: number;
  };
  recipientAddress?: {
    name: string;
    phone: string;
    fullAddress?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  itemList?: Array<{
    productId: string;
    productName: string;
    skuId: string;
    skuName: string;
    skuImage?: string;
    sellerSku: string;
    quantity: number;
    originalPrice: number;
    salePrice: number;
  }>;
  rawData: any; // Store full TikTok response
  syncedAt: Date;
  lastFetchedDetailAt?: Date;
}

const TikTokOrderSchema: Schema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderStatus: {
      type: String,
      required: true,
      index: true,
    },
    createTime: {
      type: Number,
      required: true,
      index: true,
    },
    updateTime: {
      type: Number,
      required: true,
    },
    buyerUserId: String,
    shippingType: String,
    payment: {
      currency: String,
      subTotal: Number,
      shippingFee: Number,
      platformDiscount: Number,
      sellerDiscount: Number,
      totalAmount: Number,
    },
    recipientAddress: {
      name: String,
      phone: String,
      fullAddress: String,
      district: String,
      city: String,
      province: String,
      postalCode: String,
    },
    itemList: [
      {
        productId: String,
        productName: String,
        skuId: String,
        skuName: String,
        skuImage: String,
        sellerSku: String,
        quantity: Number,
        originalPrice: Number,
        salePrice: Number,
      },
    ],
    rawData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastFetchedDetailAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITikTokOrder>('TikTokOrder', TikTokOrderSchema);
