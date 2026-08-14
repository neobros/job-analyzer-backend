import express from 'express';
import JobApplication from '../models/JobApplication.js';
import JobPost from '../models/JobPost.js';
import Location from '../models/Location.js';
import Profile from '../models/Profile.js';
import Review from '../models/Review.js';
import ServiceGig from '../models/ServiceGig.js';
import User from '../models/User.js';

const router = express.Router();

function badgePriority(item, userKey = 'user') {
  return item?.[userKey]?.hasPriorityBadge ? 1 : 0;
}

function sortByBadgeThenDate(userKey) {
  return (a, b) => {
    const badgeDifference = badgePriority(b, userKey) - badgePriority(a, userKey);
    if (badgeDifference) return badgeDifference;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  };
}

router.get('/home', async (_req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const previousYearStart = new Date(previousYear, 0, 1);
    const previousYearEnd = new Date(currentYear, 0, 1);
    const previousYearFilter = { createdAt: { $gte: previousYearStart, $lt: previousYearEnd } };

    const [jobs, gigs, profiles, locations, stats, previousStats, flowStats] = await Promise.all([
      JobPost.find({ status: 'approved' }).populate('employer', 'isVerifiedByAdmin hasPriorityBadge').sort({ isFeatured: -1, createdAt: -1 }).limit(30),
      ServiceGig.find({ status: 'approved' }).populate('seller', 'isVerifiedByAdmin hasPriorityBadge').sort({ ratingAverage: -1, createdAt: -1 }).limit(30),
      Profile.find().select('-hiddenContact').populate('user', 'role isVerifiedByAdmin isEmailVerified hasPriorityBadge').sort({ ratingAverage: -1, createdAt: -1 }).limit(30),
      Location.find({ isActive: true }).select('country cities').sort({ country: 1 }),
      Promise.all([
        User.countDocuments({ isBlocked: false }),
        User.countDocuments({ isVerifiedByAdmin: true }),
        JobPost.countDocuments({ status: 'approved' }),
        JobPost.countDocuments({ status: 'pending' }),
        ServiceGig.countDocuments({ status: 'approved' }),
        ServiceGig.countDocuments({ status: 'pending' }),
        JobApplication.countDocuments(),
        Review.countDocuments({ status: 'approved' })
      ]),
      Promise.all([
        User.countDocuments(previousYearFilter),
        JobPost.countDocuments({ ...previousYearFilter, status: 'approved' }),
        ServiceGig.countDocuments({ ...previousYearFilter, status: 'approved' }),
        JobApplication.countDocuments(previousYearFilter),
        Review.countDocuments({ ...previousYearFilter, status: 'approved' })
      ]),
      Promise.all([
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments({ isEmailVerified: false }),
        User.countDocuments({ isBlocked: true }),
        JobPost.countDocuments({ status: 'pending' }),
        JobPost.countDocuments({ status: 'approved' }),
        JobPost.countDocuments({ status: 'rejected' }),
        ServiceGig.countDocuments({ status: 'pending' }),
        ServiceGig.countDocuments({ status: 'approved' }),
        ServiceGig.countDocuments({ status: 'rejected' }),
        JobApplication.countDocuments({ status: 'submitted' }),
        JobApplication.countDocuments({ status: 'under_review' }),
        JobApplication.countDocuments({ status: 'admin_contacted' }),
        JobApplication.countDocuments({ status: 'shortlisted' }),
        JobApplication.countDocuments({ status: 'hired' }),
        Review.countDocuments({ status: 'pending' }),
        Review.countDocuments({ status: 'approved' }),
        Review.countDocuments({ status: 'rejected' })
      ])
    ]);

    const categoryNames = [...new Set([...jobs.map((job) => job.category), ...gigs.map((gig) => gig.category)].filter(Boolean))];
    const categories = categoryNames
      .map((name) => ({
        name,
        jobs: jobs.filter((job) => job.category === name).length,
        gigs: gigs.filter((gig) => gig.category === name).length
      }))
      .map((category) => ({ ...category, count: category.jobs + category.gigs }))
      .sort((a, b) => b.count - a.count);

    const [users, verifiedUsers, approvedJobs, pendingJobs, approvedGigs, pendingGigs, applications, reviews] = stats;
    const [previousUsers, previousJobs, previousGigs, previousApplications, previousReviews] = previousStats;
    const [
      emailVerified,
      emailUnverified,
      blockedUsers,
      pendingJobPosts,
      approvedJobPosts,
      rejectedJobPosts,
      pendingGigPosts,
      approvedGigPosts,
      rejectedGigPosts,
      submittedApplications,
      underReviewApplications,
      adminContactedApplications,
      shortlistedApplications,
      hiredApplications,
      pendingReviews,
      approvedReviews,
      rejectedReviews
    ] = flowStats;

    res.json({
      stats: {
        users,
        verifiedUsers,
        approvedJobs,
        pendingJobs,
        approvedGigs,
        pendingGigs,
        applications,
        reviews,
        countries: locations.length,
        cities: locations.reduce((sum, location) => sum + location.cities.filter((city) => city.isActive).length, 0)
      },
      previousYearHighlights: {
        year: previousYear,
        users: previousUsers,
        approvedJobs: previousJobs,
        approvedGigs: previousGigs,
        applications: previousApplications,
        reviews: previousReviews
      },
      flow: {
        accounts: {
          emailVerified,
          emailUnverified,
          blockedUsers,
          adminVerified: verifiedUsers
        },
        jobModeration: {
          pending: pendingJobPosts,
          approved: approvedJobPosts,
          rejected: rejectedJobPosts
        },
        gigModeration: {
          pending: pendingGigPosts,
          approved: approvedGigPosts,
          rejected: rejectedGigPosts
        },
        applications: {
          submitted: submittedApplications,
          underReview: underReviewApplications,
          adminContacted: adminContactedApplications,
          shortlisted: shortlistedApplications,
          hired: hiredApplications
        },
        reviews: {
          pending: pendingReviews,
          approved: approvedReviews,
          rejected: rejectedReviews
        }
      },
      jobs: jobs.sort(sortByBadgeThenDate('employer')).slice(0, 8),
      gigs: gigs.sort(sortByBadgeThenDate('seller')).slice(0, 8),
      profiles: profiles.sort(sortByBadgeThenDate('user')).slice(0, 8),
      categories,
      locations
    });
  } catch (error) {
    next(error);
  }
});

export default router;
