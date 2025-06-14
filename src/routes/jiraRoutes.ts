import express from 'express';
import { JiraController } from '../controllers';
import { catchAsync } from '../utils';
import { authMiddleware } from '../middlewares';
import { validateJiraAccessTokenMiddleware } from '../middlewares';

const router = express.Router();

router.post(
  '/auth',
  authMiddleware,
  catchAsync(JiraController.generateAuthUrl)
);

router.get('/auth/callback', catchAsync(JiraController.oauthCallback));

export default router;
