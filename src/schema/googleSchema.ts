import * as Yup from 'yup';
import { validatorUtils } from '../utils';

const validateGetCalendarEvents = async (data: any) => {
  const schema = Yup.object({
    startDate: Yup.string().required('startDate is required'),
    endDate: Yup.string().required('endDate is required'),
    limit: Yup.number().min(1).max(200).default(10),
    pageToken: Yup.string().default(''),
  });

  return await validatorUtils.validate(schema, data);
};

const validateCreateCalendarEvent = async (data: any) => {
  const schema = Yup.object({
    summary: Yup.string().required('summary is required'),
    description: Yup.string().notRequired(),
    startTime: Yup.date().required('startTime is required'),
    endTime: Yup.date().required('endTime is required'),
    attendees: Yup.array()
      .of(
        Yup.string()
          .email('Each attendee must be a valid email')
          .required('Email is required')
      )
      .notRequired(),
    isVideoLink: Yup.boolean().default(false),
  });

  return await validatorUtils.validate(schema, data);
};

const validateDeleteCalendarEvent = async (data: any) => {
  const schema = Yup.object({
    eventId: Yup.string().required('eventId is required'),
  });

  return await validatorUtils.validate(schema, data);
};

export default {
  validateGetCalendarEvents,
  validateCreateCalendarEvent,
  validateDeleteCalendarEvent,
};
