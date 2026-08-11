import express from 'express';
import mongoose from 'mongoose';
import JobPost from '../models/JobPost.js';
import { requireAuth, requireRole, requireVerifiedEmail } from '../middleware/auth.js';

const router = express.Router();

function sortByEmployerPriority(a, b) {
  const badgeDifference = Number(Boolean(b.employer?.hasPriorityBadge)) - Number(Boolean(a.employer?.hasPriorityBadge));
  if (badgeDifference) return badgeDifference;
  const featuredDifference = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
  if (featuredDifference) return featuredDifference;
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

router.get('/', async (req, res, next) => {
  try {
    const { q, category, city, country, skills } = req.query;
    const filter = { status: 'approved' };

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (city) filter.city = new RegExp(city, 'i');
    if (country) filter.country = new RegExp(country, 'i');
    if (skills) filter.skills = { $in: String(skills).split(',').map((skill) => new RegExp(skill.trim(), 'i')) };

    const jobs = await JobPost.find(filter).populate('employer', 'email isVerifiedByAdmin hasPriorityBadge').sort({ isFeatured: -1, createdAt: -1 }).limit(100);
    res.json(jobs.sort(sortByEmployerPriority).slice(0, 50));
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const jobs = await JobPost.find({ employer: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = await JobPost.findOne({ _id: req.params.id, status: 'approved' })
      .populate('employer', 'email isVerifiedByAdmin hasPriorityBadge');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireVerifiedEmail, requireRole('employer', 'admin'), async (req, res, next) => {
  try {
    const job = await JobPost.create({
      ...req.body,
      employer: req.user._id,
      skills: typeof req.body.skills === 'string' ? req.body.skills.split(',').map((skill) => skill.trim()).filter(Boolean) : req.body.skills
    });
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const job = await JobPost.findOneAndUpdate(
      { _id: req.params.id, employer: req.user._id },
      { ...req.body, status: 'pending' },
      { new: true }
    );

    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const job = await JobPost.findOneAndDelete({ _id: req.params.id, employer: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
