import express from 'express';
import Category from '../models/Category.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const defaults = [
  'IT',
  'Marketing',
  'Design',
  'Writing',
  'Data Entry',
  'Engineering',
  'Accounting',
  'Sales',
  'Customer Support',
  'Remote Jobs',
  'Part Time Jobs',
  'Freelance Jobs'
];

router.get('/', async (_req, res, next) => {
  try {
    const existing = await Category.find({ isActive: true }).sort({ name: 1 });
    if (existing.length) return res.json(existing);

    const created = await Category.insertMany(
      defaults.map((name) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        type: 'both'
      }))
    );
    res.json(created);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

export default router;
