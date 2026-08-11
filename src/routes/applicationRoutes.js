import express from 'express';
import JobApplication from '../models/JobApplication.js';
import JobPost from '../models/JobPost.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ applicant: req.user._id })
      .populate('job', 'title category city country salary status')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.get('/job/:jobId', requireAuth, async (req, res, next) => {
  try {
    const job = await JobPost.findOne({ _id: req.params.jobId, employer: req.user._id });
    if (!job && req.user.role !== 'admin') return res.status(403).json({ message: 'Admin approval required to view applicant contact details' });

    const applications = await JobApplication.find({ job: req.params.jobId })
      .populate('applicant', 'email isEmailVerified isVerifiedByAdmin')
      .populate('job', 'title');
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

router.post('/:jobId/apply', requireAuth, requireVerifiedEmail, upload.single('cvFile'), async (req, res, next) => {
  try {
    const job = await JobPost.findOne({ _id: req.params.jobId, status: 'approved' });
    if (!job) return res.status(404).json({ message: 'Approved job not found' });

    const application = await JobApplication.create({
      job: job._id,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter,
      cvFile: req.file?.path
    });

    res.status(201).json(application);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You already applied for this job' });
    next(error);
  }
});

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const ownsJob = String(application.job.employer) === String(req.user._id);
    if (!ownsJob && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    application.status = req.body.status;
    await application.save();
    res.json(application);
  } catch (error) {
    next(error);
  }
});

export default router;
