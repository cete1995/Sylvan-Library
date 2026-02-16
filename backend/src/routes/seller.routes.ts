import { Router, Request, Response } from 'express';
import User from '../models/User.model';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Get all sellers (admin only)
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const sellers = await User.find({ role: 'seller' }).select('-passwordHash');
    res.json({ sellers });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ message: 'Failed to fetch sellers' });
  }
});

// Create a new seller (admin only)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create seller
    const seller = new User({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'seller',
    });

    await seller.save();

    // Return seller without password
    const sellerData = await User.findById(seller._id).select('-passwordHash');
    res.status(201).json({ seller: sellerData });
  } catch (error) {
    console.error('Error creating seller:', error);
    res.status(500).json({ message: 'Failed to create seller' });
  }
});

// Delete a seller (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const seller = await User.findById(id);
    if (!seller) {
      res.status(404).json({ message: 'Seller not found' });
      return;
    }

    if (seller.role !== 'seller') {
      res.status(400).json({ message: 'User is not a seller' });
      return;
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Seller deleted successfully' });
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({ message: 'Failed to delete seller' });
  }
});

// Update seller info (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    const seller = await User.findById(id);
    if (!seller) {
      res.status(404).json({ message: 'Seller not found' });
      return;
    }

    if (seller.role !== 'seller') {
      res.status(400).json({ message: 'User is not a seller' });
      return;
    }

    // Check if email is being changed and if it's already in use
    if (email && email.toLowerCase() !== seller.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({ message: 'Email already in use' });
        return;
      }
      seller.email = email.toLowerCase();
    }

    // Update name if provided
    if (name !== undefined) {
      seller.name = name;
    }

    await seller.save();

    const updatedSeller = await User.findById(id).select('-passwordHash');
    res.json({ seller: updatedSeller, message: 'Seller updated successfully' });
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({ message: 'Failed to update seller' });
  }
});

// Update seller password (admin only)
router.put('/:id/password', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const seller = await User.findById(id);
    if (!seller) {
      res.status(404).json({ message: 'Seller not found' });
      return;
    }

    if (seller.role !== 'seller') {
      res.status(400).json({ message: 'User is not a seller' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    seller.passwordHash = passwordHash;
    await seller.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating seller password:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

export default router;
