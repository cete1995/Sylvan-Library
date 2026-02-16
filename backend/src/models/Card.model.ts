import mongoose, { Document, Schema } from 'mongoose';

export type CardCondition = 'NM' | 'LP' | 'P';
export type CardFinish = 'nonfoil' | 'foil' | 'etched';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';

export interface IInventoryItem {
  condition: CardCondition;
  finish: CardFinish;
  quantityOwned: number;
  quantityForSale: number;
  buyPrice: number;
  sellPrice: number;
  sellerId?: string;
  sellerName?: string;
  // TikTok Shop / Tokopedia sync fields
  tiktokProductId?: string;
  tiktokSkuId?: string;
  sellerSku?: string;
}

export interface ICard extends Document {
  name: string;
  setCode: string;
  setName: string;
  releaseDate?: string;
  collectorNumber: string;
  language: string;
  imageUrl?: string;
  scryfallId?: string;
  uuid?: string;
  typeLine?: string;
  oracleText?: string;
  colorIdentity: string[];
  rarity: CardRarity;
  manaCost?: string;
  borderColor?: string;
  frameEffects?: string[];
  tags?: string[];
  notes?: string;
  isActive: boolean;
  inventory: IInventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>({
  condition: {
    type: String,
    enum: {
      values: ['NM', 'LP', 'P'],
      message: 'Condition must be one of: NM, LP, P',
    },
    required: true,
  },
  finish: {
    type: String,
    enum: {
      values: ['nonfoil', 'foil', 'etched'],
      message: 'Finish must be one of: nonfoil, foil, etched',
    },
    required: true,
  },
  quantityOwned: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  quantityForSale: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  buyPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  sellPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  sellerId: {
    type: String,
    required: false,
  },
  sellerName: {
    type: String,
    required: false,
  },
  // TikTok Shop / Tokopedia sync fields
  tiktokProductId: {
    type: String,
    required: false,
  },
  tiktokSkuId: {
    type: String,
    required: false,
  },
  sellerSku: {
    type: String,
    required: false,
  },
}, { _id: false });

const cardSchema = new Schema<ICard>(
  {
    name: {
      type: String,
      required: [true, 'Card name is required'],
      trim: true,
      index: true,
    },
    setCode: {
      type: String,
      required: [true, 'Set code is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    setName: {
      type: String,
      required: [true, 'Set name is required'],
      trim: true,
    },
    releaseDate: {
      type: String,
      required: false,
      trim: true,
    },
    collectorNumber: {
      type: String,
      required: [true, 'Collector number is required'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      default: 'EN',
      uppercase: true,
      trim: true,
    },
    inventory: {
      type: [inventoryItemSchema],
      default: [],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    scryfallId: {
      type: String,
      trim: true,
      index: true,
    },
    uuid: {
      type: String,
      trim: true,
      index: true,
    },
    typeLine: {
      type: String,
      trim: true,
    },
    oracleText: {
      type: String,
      trim: true,
    },
    colorIdentity: {
      type: [String],
      default: [],
      validate: {
        validator: function (colors: string[]) {
          const validColors = ['W', 'U', 'B', 'R', 'G'];
          return colors.every((color) => validColors.includes(color));
        },
        message: 'Color identity must contain only W, U, B, R, G',
      },
    },
    rarity: {
      type: String,
      enum: {
        values: ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus'],
        message: 'Rarity must be one of: common, uncommon, rare, mythic, special, bonus',
      },
      required: [true, 'Rarity is required'],
      default: 'common',
    },
    manaCost: {
      type: String,
      trim: true,
    },
    borderColor: {
      type: String,
      trim: true,
    },
    frameEffects: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
cardSchema.index({ name: 1, setCode: 1, collectorNumber: 1 });
cardSchema.index({ isActive: 1 });
cardSchema.index({ rarity: 1 });

// Text index for search
cardSchema.index({ name: 'text', setName: 'text', typeLine: 'text' });

// Virtual property for tags (computed from borderColor and frameEffects)
cardSchema.virtual('tags').get(function(this: ICard) {
  const tags: string[] = [];
  if (this.borderColor === 'borderless') {
    tags.push('Borderless');
  }
  if (this.frameEffects?.includes('extendedart')) {
    tags.push('Extended Art');
  }
  return tags;
});

// Ensure virtuals are included in JSON output
cardSchema.set('toJSON', { virtuals: true });
cardSchema.set('toObject', { virtuals: true });

const Card = mongoose.model<ICard>('Card', cardSchema);

export default Card;
