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
  },
  { timestamps: true }
);

BoardGameSchema.index({ name: 'text', category: 'text' });
BoardGameSchema.index({ available: 1, sortOrder: 1 });

export default mongoose.model<IBoardGame>('BoardGame', BoardGameSchema);
