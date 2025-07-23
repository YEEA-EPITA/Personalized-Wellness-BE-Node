import mongoose from './mongoose';
import PlatformsModel from './PlatformsModel';
import EventModel from './EventModel'
import dotenv from 'dotenv';

export { mongoose, PlatformsModel, EventModel };

dotenv.config();