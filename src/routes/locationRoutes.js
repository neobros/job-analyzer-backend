import express from 'express';
import Location from '../models/Location.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const locations = await Location.find({ isActive: true })
      .select('country iso2 cities isActive')
      .sort({ country: 1 });

    res.json(
      locations.map((location) => ({
        _id: location._id,
        country: location.country,
        iso2: location.iso2,
        cities: location.cities.filter((city) => city.isActive).map((city) => ({ _id: city._id, name: city.name }))
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/countries', async (_req, res, next) => {
  try {
    const countries = await Location.find({ isActive: true }).select('country iso2').sort({ country: 1 });
    res.json(countries);
  } catch (error) {
    next(error);
  }
});

router.get('/cities', async (req, res, next) => {
  try {
    const location = await Location.findOne({ country: req.query.country, isActive: true }).select('cities');
    if (!location) return res.json([]);
    res.json(location.cities.filter((city) => city.isActive).map((city) => ({ _id: city._id, name: city.name })));
  } catch (error) {
    next(error);
  }
});

export default router;
