import mongoose, { Document, Schema } from 'mongoose';

export interface IBoardGame extends Document {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number; // estimated play time in minutes
  category: string;        // e.g. "Strategy", "Party", "Family", "Co-op"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string;
  available: boolean;      // currently on the shelf
  featured: boolean;       // show prominently on cafe page
  sortOrder: number;
  // Rich detail-page fields
  gallery: string[];       // extra image URLs for detail page gallery
  howToPlay: string;       // how-to-play description / rules overview
  designer: string;        // game designer name
  publisher: string;       // publisher name
  age: string;             // minimum age e.g. "10+"
  createdAt: Date;
  updatedAt: Date;
}

const BoardGameSchema = new Schema<IBoardGame>(
  {
    name:            { type: String, required: true, trim: true },
    description:     { type: String, default: '' },
    minPlayers:      { type: Number, default: 2 },
    maxPlayers:      { type: Number, default: 4 },
    durationMinutes: { type: Number, default: 60 },
    category:        { type: String, default: 'General' },
    difficulty:      { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    imageUrl:        { type: String, default: '' },
    available:       { type: Boolean, default: true },
    featured:        { type: Boolean, default: false },
    sortOrder:       { type: Number, default: 0 },
    gallery:         { type: [String], default: [] },
    howToPlay:       { type: String, default: '' },
    designer:        { type: String, default: '' },
    publisher:       { type: String, default: '' },
    age:             { type: String, default: '' },
  },
  { timestamps: true }
);

BoardGameSchema.index({ name: 'text', category: 'text' });
BoardGameSchema.index({ available: 1, sortOrder: 1 });

export default mongoose.model<IBoardGame>('BoardGame', BoardGameSchema);
