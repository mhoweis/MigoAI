// src/api/search/routes.ts
import { Router } from 'express';
import { searchController } from './controller';

const publicRouter = Router();
const protectedRouter = Router();

// ========== PUBLIC SEARCH ==========

// Search events
publicRouter.get('/events', searchController.searchEvents);

// Search locations
publicRouter.get('/locations', searchController.searchLocations);

// Auto-complete suggestions
publicRouter.get('/suggestions', searchController.getSuggestions);

// ========== PROTECTED SEARCH (Personalized) ==========

// Personalized search
protectedRouter.get('/personalized', searchController.personalizedSearch);

// Save search preferences
protectedRouter.post('/preferences', searchController.saveSearchPreferences);

// Search history
protectedRouter.get('/history', searchController.getSearchHistory);
protectedRouter.delete('/history', searchController.clearSearchHistory);

export default {
  public: publicRouter,
  protected: protectedRouter
};