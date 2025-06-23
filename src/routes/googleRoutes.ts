import express, { Router } from 'express';
import { catchAsync } from '../utils';
import {
  validateGoogleAccessTokenMiddleware,
  validatorMiddleware,
  authMiddleware,
} from '../middlewares';
import { GoogleController } from '../controllers';
import { googleSchema } from '../schema';

const router: Router = express.Router();

router.get(
  '/auth',
  authMiddleware,
  catchAsync(GoogleController.generateAuthUrl)
);

router.get('/auth/callback', catchAsync(GoogleController.handleAuthCallback));

router.get(
  '/calendar/events',
  authMiddleware,
  validatorMiddleware(googleSchema.validateGetCalendarEvents, 'query'),
  validateGoogleAccessTokenMiddleware,
  catchAsync(GoogleController.getGoogleCalendarEvents)
);

router.post(
  '/calendar/events',
  authMiddleware,
  validatorMiddleware(googleSchema.validateCreateCalendarEvent, 'body'),
  validateGoogleAccessTokenMiddleware,
  catchAsync(GoogleController.createGoogleCalendarEvent)
);

router.patch(
  '/calendar/events/:eventId',
  authMiddleware,
  validatorMiddleware(googleSchema.validateCreateCalendarEvent, 'body'),
  validateGoogleAccessTokenMiddleware,
  catchAsync(GoogleController.updateGoogleCalendarEvent)
);

router.delete(
  '/calendar/events/:eventId',
  authMiddleware,
  validatorMiddleware(googleSchema.validateDeleteCalendarEvent, 'params'),
  validateGoogleAccessTokenMiddleware,
  catchAsync(GoogleController.deleteGoogleCalendarEvent)
);

router.get(
  '/gmail/messages',
  authMiddleware,
  validateGoogleAccessTokenMiddleware,
  catchAsync(GoogleController.getGmailMessages)
);

export default router;
