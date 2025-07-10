import express, { Router } from 'express';
import { catchAsync } from '../utils';
import { authMiddleware } from '../middlewares';
import { EmailController } from '../controllers';

const router: Router = express.Router();

router.get(
  '/events/:connectorId',
  authMiddleware, 
  catchAsync(EmailController.getEventsByConnectorId)
);

export default router;
