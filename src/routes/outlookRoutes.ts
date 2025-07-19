import express from 'express';
import { OutlookController } from '../controllers';
import { catchAsync } from '../utils';
import { authMiddleware } from '../middlewares';
import {} from '../middlewares';
import validateOutlookAccessTokenMiddleware from '../middlewares/validateOutlookAccessTokenMiddleware';

const router = express.Router();

router.get(
  '/auth',
  authMiddleware,
  catchAsync(OutlookController.generateAuthUrl)
);

router.get('/auth/callback', catchAsync(OutlookController.oauthCallback));

router.get(
  '/mails',
  authMiddleware,
  validateOutlookAccessTokenMiddleware,
  catchAsync(OutlookController.getMails)
);

router.get(
  '/mails/classify',
  authMiddleware,
  validateOutlookAccessTokenMiddleware,
  catchAsync(OutlookController.classifyOutlookMessages)
);


export default router;
