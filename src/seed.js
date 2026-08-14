import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Profile from './models/Profile.js';
import JobPost from './models/JobPost.js';
import JobApplication from './models/JobApplication.js';
import ServiceGig from './models/ServiceGig.js';
import Review from './models/Review.js';
import Location from './models/Location.js';
import Listing from './models/Listing.js';

const defaultLocations = [
  { country: 'Australia', iso2: 'AU', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] },
  { country: 'Canada', iso2: 'CA', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'] },
  { country: 'India', iso2: 'IN', cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai'] },
  { country: 'Malaysia', iso2: 'MY', cities: ['Kuala Lumpur', 'Penang', 'Johor Bahru'] },
  { country: 'Singapore', iso2: 'SG', cities: ['Singapore'] },
  { country: 'Sri Lanka', iso2: 'LK', cities: ['Colombo', 'Kandy', 'Galle', 'Jaffna'] },
  { country: 'United Arab Emirates', iso2: 'AE', cities: ['Dubai', 'Abu Dhabi', 'Sharjah'] },
  { country: 'United Kingdom', iso2: 'GB', cities: ['London', 'Manchester', 'Birmingham'] },
  { country: 'United States', iso2: 'US', cities: ['New York', 'Los Angeles', 'San Francisco', 'Chicago'] },
  { country: 'Remote', iso2: 'RW', cities: ['Worldwide'] }
];

const demoUsers = [
  {
    key: 'admin',
    email: 'admin@liveinaus.com',
    password: 'Admin@12345',
    role: 'admin',
    fullName: 'LiveInAus Admin',
    country: 'Sri Lanka',
    city: 'Colombo',
    about: 'Marketplace administrator with full moderation access.'
  },
  {
    key: 'user',
    email: 'jobseeker@liveinaus.com',
    password: 'User@12345',
    role: 'user',
    fullName: 'Ari Morgan',
    country: 'Australia',
    city: 'Melbourne',
    skills: ['React', 'Node.js', 'MongoDB'],
    about: 'Verified user looking for global remote roles and services.'
  },
  {
    key: 'employerSupplier',
    email: 'employer@liveinaus.com',
    password: 'Employer@12345',
    role: 'supplier',
    fullName: 'Northstar Labs',
    country: 'Canada',
    city: 'Toronto',
    hasPriorityBadge: true,
    about: 'Verified supplier posting worldwide vacancies.',
    company: {
      name: 'Northstar Labs',
      website: 'https://northstarlabs.example',
      size: '51-200',
      description: 'Software company hiring global talent.'
    }
  },
  {
    key: 'freelancerSupplier',
    email: 'seller@liveinaus.com',
    password: 'Seller@12345',
    role: 'supplier',
    fullName: 'Maya Chen',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    skills: ['UI Design', 'Figma', 'Brand Systems'],
    hasPriorityBadge: true,
    about: 'Verified supplier offering design and freelance services.'
  }
];

// One or two demo listings per vertical so the Platform hub and the admin
// Listings queue both have real data to show right after seeding.
const demoListings = [
  { vertical: 'accommodation', title: 'Sunny double room near Monash University', category: 'Shared housing', price: 210, country: 'Australia', city: 'Melbourne', description: 'Furnished double room in a quiet share house, 10 minutes from campus by tram. Bills included.', status: 'approved', details: { bedrooms: 1, furnished: true } },
  { vertical: 'accommodation', title: '2-bedroom apartment, short-stay ready', category: 'Short-stay rental', price: 145, country: 'Canada', city: 'Toronto', description: 'Fully furnished 2-bedroom apartment available for stays from 2 weeks, ideal while house-hunting.', status: 'pending', details: { bedrooms: 2, furnished: true } },
  { vertical: 'education', title: 'IELTS preparation course - evening classes', category: 'Language course', price: 320, country: 'United Kingdom', city: 'Manchester', description: 'Eight-week evening IELTS preparation course with small class sizes and mock exams.', status: 'approved', details: { studyLevel: 'Intermediate to advanced' } },
  { vertical: 'education', title: 'Credential recognition consultation', category: 'Counselling', price: 90, country: 'Australia', city: 'Sydney', description: 'One-on-one session to map your overseas qualifications against local recognition pathways.', status: 'approved', details: { studyLevel: 'All levels' } },
  { vertical: 'migration', title: 'Skilled visa consultation - registered migration lawyer', category: 'Lawyer', price: 150, country: 'Australia', city: 'Melbourne', description: 'Initial consultation with a registered migration lawyer covering skilled visa pathways.', status: 'approved', details: {} },
  { vertical: 'migration', title: 'Panel doctor - visa medical examination', category: 'Doctor', price: 220, country: 'Australia', city: 'Sydney', description: 'Approved panel doctor conducting visa medical examinations for skilled and family visas.', status: 'approved', details: {} },
  { vertical: 'real-estate', title: 'Modern 3-bedroom family home', category: 'For sale', price: 620000, country: 'Australia', city: 'Brisbane', description: 'Renovated 3-bedroom home close to schools and public transport, move-in ready.', status: 'approved', details: { bedrooms: 3, listingType: 'For sale' } },
  { vertical: 'real-estate', title: 'City-view 1-bedroom unit for rent', category: 'For rent', price: 480, country: 'Singapore', city: 'Singapore', description: 'Bright 1-bedroom unit in the CBD with gym and pool access.', status: 'pending', details: { bedrooms: 1, listingType: 'For rent' } },
  { vertical: 'cars-transport', title: '2019 Toyota Corolla - low mileage', category: 'Used car', price: 16500, country: 'Canada', city: 'Vancouver', description: 'Single-owner Corolla, full service history, ready for a quick sale.', status: 'approved', details: { make: 'Toyota', model: 'Corolla', mileage: 42000 } },
  { vertical: 'banking-finance', title: 'International money transfer setup', category: 'Money transfer', price: 0, country: 'United Arab Emirates', city: 'Dubai', description: 'Free consultation to set up low-fee international transfers back home.', status: 'approved', details: {} },
  { vertical: 'insurance', title: 'New-resident health insurance comparison', category: 'Health insurance', price: 0, country: 'Australia', city: 'Perth', description: 'Compare health cover options designed for visa holders and new residents.', status: 'approved', details: { insuranceType: 'Health' } },
  { vertical: 'utilities', title: 'Electricity + internet bundle setup', category: 'Connection service', price: 0, country: 'United Kingdom', city: 'London', description: 'Same-week connection for electricity and home internet, no lock-in contract.', status: 'pending', details: { serviceType: 'Electricity & Internet' } },
  { vertical: 'healthcare', title: 'Multilingual GP clinic - new patients welcome', category: 'General practice', price: 0, country: 'Canada', city: 'Toronto', description: 'Family clinic offering consultations in English, Mandarin, and Spanish.', status: 'approved', details: { specialty: 'General practice' } },
  { vertical: 'family-community', title: 'Weekend playgroup for newcomer families', category: 'Community group', price: 0, country: 'Australia', city: 'Melbourne', description: 'Free weekly playgroup connecting newcomer families with kids under 5.', status: 'approved', details: {} },
  { vertical: 'legal-tax', title: 'First-year tax return consultation', category: 'Tax advisory', price: 120, country: 'United States', city: 'New York', description: 'Guidance on filing your first tax return as a new resident or visa holder.', status: 'approved', details: { serviceType: 'Tax' } },
  { vertical: 'marketplace', title: 'Complete starter furniture bundle', category: 'Furniture', price: 350, country: 'Malaysia', city: 'Kuala Lumpur', description: 'Bed frame, desk, and wardrobe in good condition, pickup only.', status: 'approved', details: { condition: 'Used - good' } },
  { vertical: 'food-lifestyle', title: 'Home-style South Asian grocery delivery', category: 'Grocery', price: 0, country: 'Sri Lanka', city: 'Colombo', description: 'Weekly delivery of home-style groceries and spices across the city.', status: 'pending', details: { cuisineType: 'South Asian' } },
  { vertical: 'travel', title: 'Airport pickup and settling-in tour', category: 'Airport transfer', price: 60, country: 'Australia', city: 'Sydney', description: 'Airport pickup plus a half-day orientation tour of your new suburb.', status: 'approved', details: { destination: 'Sydney' } },
  { vertical: 'media', title: 'Weekly newcomer community newsletter', category: 'News', price: 0, country: 'Canada', city: 'Toronto', description: 'Local news, events, and classifieds curated for newly arrived residents.', status: 'approved', details: { mediaType: 'Newsletter' } },
  { vertical: 'blog-news', title: 'First 90 days in Melbourne: a settlement diary', category: 'Blog post', price: 0, country: 'Australia', city: 'Melbourne', description: 'A first-hand blog series covering visas, housing, and finding work in the first three months.', status: 'approved', details: { topic: 'Settlement stories' } }
];

async function seed() {
  await connectDB();
  const usersByRole = {};

  for (const location of defaultLocations) {
    await Location.findOneAndUpdate(
      { country: location.country },
      {
        country: location.country,
        iso2: location.iso2,
        isActive: true,
        cities: location.cities.map((name) => ({ name, isActive: true }))
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  for (const demoUser of demoUsers) {
    const passwordHash = await bcrypt.hash(demoUser.password, 12);
    const user = await User.findOneAndUpdate(
      { email: demoUser.email },
      {
        email: demoUser.email,
        passwordHash,
        role: demoUser.role,
        isEmailVerified: true,
        isBlocked: false,
        isVerifiedByAdmin: true,
        hasPriorityBadge: Boolean(demoUser.hasPriorityBadge),
        otpHash: undefined,
        otpExpiresAt: undefined
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Profile.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        fullName: demoUser.fullName,
        country: demoUser.country,
        city: demoUser.city,
        skills: demoUser.skills || [],
        about: demoUser.about,
        company: demoUser.company,
        hiddenContact: { email: demoUser.email }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    usersByRole[demoUser.key] = user;
  }

  const pendingJob = await JobPost.findOneAndUpdate(
    { title: 'Senior React Engineer', employer: usersByRole.employerSupplier._id },
    {
      employer: usersByRole.employerSupplier._id,
      title: 'Senior React Engineer',
      category: 'IT',
      salary: '$85,000 - $120,000',
      country: 'Canada',
      city: 'Toronto',
      type: 'remote',
      skills: ['React', 'Node.js', 'MongoDB'],
      description: 'Build global marketplace features with a distributed product team.',
      requirements: 'Five years of production React experience and strong API knowledge.',
      status: 'pending'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await JobPost.findOneAndUpdate(
    { title: 'Customer Support Specialist', employer: usersByRole.employerSupplier._id },
    {
      employer: usersByRole.employerSupplier._id,
      title: 'Customer Support Specialist',
      category: 'Customer Support',
      salary: '$2,500 - $3,200',
      country: 'Remote',
      city: 'Worldwide',
      type: 'remote',
      skills: ['English', 'CRM', 'Customer Care'],
      description: 'Support international customers across email and help desk channels.',
      requirements: 'Professional written English and two years of support experience.',
      status: 'approved'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const gig = await ServiceGig.findOneAndUpdate(
    { title: 'I will design a modern product dashboard', seller: usersByRole.freelancerSupplier._id },
    {
      seller: usersByRole.freelancerSupplier._id,
      title: 'I will design a modern product dashboard',
      category: 'Design',
      price: 180,
      description: 'Responsive Figma dashboard design with components and developer handoff.',
      deliveryTime: '4 days',
      portfolioImages: [],
      status: 'pending'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await JobApplication.findOneAndUpdate(
    { job: pendingJob._id, applicant: usersByRole.user._id },
    {
      job: pendingJob._id,
      applicant: usersByRole.user._id,
      coverLetter: 'I have seven years of experience building React and Node.js products.',
      status: 'submitted'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Review.findOneAndUpdate(
    { reviewer: usersByRole.employerSupplier._id, targetUser: usersByRole.freelancerSupplier._id, serviceGig: gig._id },
    {
      reviewer: usersByRole.employerSupplier._id,
      targetUser: usersByRole.freelancerSupplier._id,
      serviceGig: gig._id,
      rating: 5,
      feedback: 'Strong design work, but this review still needs admin moderation.',
      status: 'pending'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const demoPlatformReviews = [
    { rating: 5, feedback: 'Found a remote developer role within two weeks of signing up. The verification step made the whole process feel safe.' },
    { rating: 5, feedback: 'Posted a vacancy and had qualified, admin-checked applicants the same week. Much less noise than other job boards.' },
    { rating: 4, feedback: 'Sold three design gigs through the platform so far. Payments and contact details staying protected until checks are done is a nice touch.' },
    { rating: 5, feedback: 'Used the Accommodation and Migration categories while settling in Melbourne — having everything in one place saved us weeks of searching.' },
    { rating: 4, feedback: 'Great range of categories for new arrivals. Would love to see more listings in Healthcare, but support has been responsive.' }
  ];
  const reviewers = [usersByRole.user, usersByRole.employerSupplier, usersByRole.freelancerSupplier];
  for (const [index, review] of demoPlatformReviews.entries()) {
    const reviewer = reviewers[index % reviewers.length];
    await Review.findOneAndUpdate(
      { reviewer: reviewer._id, feedback: review.feedback },
      { reviewer: reviewer._id, rating: review.rating, feedback: review.feedback, status: 'approved' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  const listingOwners = [usersByRole.employerSupplier, usersByRole.freelancerSupplier];
  for (const [index, listing] of demoListings.entries()) {
    const owner = listingOwners[index % listingOwners.length];
    await Listing.findOneAndUpdate(
      { title: listing.title, owner: owner._id },
      { ...listing, owner: owner._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.table(demoUsers.map(({ email, password, role, fullName }) => ({ email, password, role, fullName })));
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
