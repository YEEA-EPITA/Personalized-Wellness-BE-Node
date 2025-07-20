import { Request, Response, NextFunction } from 'express';
import { EventModel, PlatformsModel } from '../models';
import { GeneralErrorsFactory, GeneralResponsesFactory } from '../factories';

export class EmailController {
  static async getEventsByConnectorId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { connectorId } = req.params;

      const platforms = await PlatformsModel.find({ connectorId }).lean();
      if (!platforms.length) {
        throw new Error('No platforms found for this connectorId');
      }

      const allEvents = (
        await Promise.all(
          platforms.map(async ({ email, type }) => {
            const events = await EventModel
              .find({ userEmail: email })
              .select('-createdAt -updatedAt -__v -receivedDateTime')
              .lean();
            return events.map((e) => ({ ...e, type: type.toLowerCase() }));
          })
        )
      ).flat();

      next(
        GeneralResponsesFactory.successResponse({
          data: allEvents,
          statusCode: 200,
          message: 'Email events retrieved successfully',
          key: 'events',
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getEventsByEmailsAndDate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { emails, startTime, endTime } = req.body;

    if (!Array.isArray(emails) || !startTime || !endTime) {
      throw new Error('Missing required parameters: emails, startTime, endTime');
    }

    const allResults = await Promise.all(
      emails.map(async (email: string) => {
        const events = await EventModel.find({
          userEmail: email,
          eventDateTime: { $gte: new Date(startTime) },
          endDateTime: { $lte: new Date(endTime) },
        })
          .select('-createdAt -updatedAt -__v -receivedDateTime')
          .lean();

        const formattedEvents = events.map((event) => ({
          ...event,
          startTime: event.eventDateTime,
          endTime: event.endDateTime,
          eventDateTime: undefined,
          endDateTime: undefined,
        }));

        return {
          userEmail: email,
          events: formattedEvents,
        };
      })
    );

    next(
      GeneralResponsesFactory.successResponse({
        data: allResults,
        statusCode: 200,
        message: 'Email events retrieved successfully',
        key: 'events',
      })
    );
  } catch (error) {
    next(error);
  }
}
}
