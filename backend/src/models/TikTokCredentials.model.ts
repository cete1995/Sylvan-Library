import mongoose, { Document, Schema } from 'mongoose';

export interface ITikTokCredentials extends Document {
  appKey: string;       // encrypted
  appSecret: string;    // encrypted
  accessToken: string;  // encrypted
  refreshToken: string; // encrypted
  shopCipher: string;   // encrypted
  updatedAt: Date;
}

const TikTokCredentialsSchema = new Schema<ITikTokCredentials>(
  {
    appKey:       { type: String, default: '' },
    appSecret:    { type: String, default: '' },
    accessToken:  { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    shopCipher:   { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ITikTokCredentials>('TikTokCredentials', TikTokCredentialsSchema);
