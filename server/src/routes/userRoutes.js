import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  getMyBookings, 
  getMyHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
  getSearchHistory,
  logSearch,
  getRecentlyViewed,
  logRecentlyViewed,
  addReview
} from '../controllers/userController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/change-password', changePassword);
router.get('/bookings', getMyBookings);
router.get('/history', getMyHistory);

// Favorites
router.get('/favorites', getFavorites);
router.post('/favorites', addFavorite);
router.delete('/favorites/:routeId', removeFavorite);

// Search history
router.get('/search-history', getSearchHistory);
router.post('/search-history', logSearch);

// Recently viewed
router.get('/recently-viewed', getRecentlyViewed);
router.post('/recently-viewed', logRecentlyViewed);

// Reviews
router.post('/reviews', addReview);

export default router;
