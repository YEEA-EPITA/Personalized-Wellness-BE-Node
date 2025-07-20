import { Request, Response, NextFunction } from 'express';
import { GoogleServices } from '../services';
import {
  GeneralEntityFactory,
  GeneralErrorsFactory,
  GeneralResponsesFactory,
} from '../factories';
import config from 'config';
import { googleUtils } from '../utils';
import { people as googlePeopleApi } from '@googleapis/people';
import { calendar as googleCalanderApi } from '@googleapis/calendar';
import crypto from 'crypto';
import { EmailProcessor} from '../services';
import  { EmailClassifier } from '../services';

export default class GoogleController {
  static async generateAuthUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { auth, scopes } = googleUtils;
      const jwtUser = req.jwtToken;

      const url = auth.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
      });

      return next(
        GeneralResponsesFactory.successResponse({
          data: url + '&state=' + jwtUser.id,
          key: 'url',
          message: 'Google authentication URL generated successfully',
          statusCode: 200,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async handleAuthCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code } = req.query;
      const { auth } = googleUtils;
      const connectorId = req.query.state as string;

      if (!code)
        return res.redirect(
          `${config.get<string>('frontendURL')}/dashboard/accounts?success=false`
        );

      const tokens = await auth.getToken(code as string);
      auth.setCredentials(tokens.tokens);

      const people = googlePeopleApi({ auth: auth, version: 'v1' });

      const peopleResponse = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos',
      });

      const findConnection = await GoogleServices.findConnection({
        type: 'GOOGLE',
        email: peopleResponse.data.emailAddresses?.[0]?.value || '',
      });

      let doc;
      if (findConnection.success && findConnection.data) {
        doc = await GoogleServices.updateConnection({
          id: findConnection.data._id,
          type: 'GOOGLE',
          name: peopleResponse.data.names?.[0]?.displayName || '',
          email: peopleResponse.data.emailAddresses?.[0]?.value || '',
          tokens: tokens.tokens,
          connectorId,
        });
      } else {
        doc = await GoogleServices.saveConnection({
          type: 'GOOGLE',
          name: peopleResponse.data.names?.[0]?.displayName || '',
          email: peopleResponse.data.emailAddresses?.[0]?.value || '',
          tokens: tokens.tokens,
          connectorId,
        });

        if (!doc.success) {
          return next(
            GeneralErrorsFactory.badRequestErr({
              customMessage: 'Failed to update Google connection',
            })
          );
        }
      }

      return res.redirect(
        `${config.get<string>('frontendURL')}/dashboard/accounts?success=true`
      );
    } catch (error) {
      next(error);
    }
  }

  static async getGoogleCalendarEvents(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { auth } = googleUtils;
      const limit = parseInt(req.query.limit as string) || 10;
      const nextPageToken = (req.query.pageToken as string) || '';
      const startDate = (req.query.startDate as string) || '';
      const endDate = (req.query.endDate as string) || '';

      const calendar = googleCalanderApi({ auth, version: 'v3' });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        maxResults: limit,
        singleEvents: true,
        orderBy: 'startTime',
        fields:
          'items(id,summary,status,created,updated,start,end,attendees,hangoutLink),nextPageToken',
        pageToken: nextPageToken,
      });

      return next(
        GeneralResponsesFactory.successResponse({
          data: response?.data,
          message: 'Google calendar events retrieved successfully',
          statusCode: 200,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async createGoogleCalendarEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { auth } = googleUtils;
      const calendar = googleCalanderApi({ auth, version: 'v3' });
      const reqData = req.body;

      const attendees = reqData.attendees.map((attendee: string) => ({
        email: attendee,
      }));

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: reqData.summary,
          description: reqData.description,
          start: {
            dateTime: new Date(reqData.startTime).toISOString(),
          },
          end: {
            dateTime: new Date(reqData.endTime).toISOString(),
          },
          attendees,
          conferenceData: reqData.isVideoLink
            ? {
                createRequest: {
                  requestId: crypto.randomUUID(),
                  conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                  },
                },
              }
            : { createRequest: {} },
        },
        conferenceDataVersion: 1,
        fields:
          'id,summary,description,status,created,updated,attendees,start,end,attendees,hangoutLink',
      });

      return next(
        GeneralResponsesFactory.successResponse({
          data: response?.data,
          message: 'Google calendar event created successfully',
          statusCode: 200,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateGoogleCalendarEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const { auth } = googleUtils;
      const calendar = googleCalanderApi({ auth, version: 'v3' });

      const { success } = await GoogleServices.getOneCalendarEvent({
        eventId,
        calendar,
      });

      if (!success)
        return next(
          GeneralErrorsFactory.notFoundErr({ customMessage: 'Event not found' })
        );

      const reqData = req.body;

      const attendees = reqData.attendees.map((attendee: string) => ({
        email: attendee,
      }));

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: {
          summary: reqData.summary,
          description: reqData.description,
          start: {
            dateTime: new Date(reqData.startTime).toISOString(),
          },
          end: {
            dateTime: new Date(reqData.endTime).toISOString(),
          },
          attendees,
          conferenceData: reqData.isVideoLink
            ? {
                createRequest: {
                  requestId: crypto.randomUUID(),
                  conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                  },
                },
              }
            : { createRequest: {} },
        },
        conferenceDataVersion: 1,
        fields:
          'id,summary,description,status,created,updated,attendees,start,end,attendees,hangoutLink',
      });

      return next(
        GeneralResponsesFactory.successResponse({
          data: response?.data,
          message: 'Google calendar event updated successfully',
          statusCode: 200,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteGoogleCalendarEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const { auth } = googleUtils;
      const calendar = googleCalanderApi({ auth, version: 'v3' });

      const { success } = await GoogleServices.getOneCalendarEvent({
        eventId,
        calendar,
      });

      if (!success)
        return next(
          GeneralErrorsFactory.notFoundErr({ customMessage: 'Event not found' })
        );

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      return next(
        GeneralResponsesFactory.successResponse({
          data: {},
          message: 'Google calendar event deleted successfully',
          statusCode: 200,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getGmailMessages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { auth } = googleUtils;

      const { success, data, error } = await GoogleServices.getGmailMessages({
        auth,
      });

      if (!success) throw error;

      next(
        GeneralResponsesFactory.successResponse({
          data,
          statusCode: 200,
          message: 'Gmail messages retrieved successfully',
          key: 'messages',
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getConnectedPlatforms(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.jwtToken;

      const { success, data, err } = await GoogleServices.getAccounts({
        userId: user.id,
      });

      if (!success) throw err;

      const cleanedData = GeneralEntityFactory.cleanMongooseData({
        data,
        extraFieldsToOmit: ['tokens', 'platformToken', '_class'],
      });

      next(
        GeneralResponsesFactory.successResponse({
          data: cleanedData,
          statusCode: 200,
          message: 'Accounts list retrived successfully',
          key: 'accounts',
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteConnectedAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.jwtToken;
      const id = req.params.id;

      const { success, data, err } = await GoogleServices.findAccount({
        userId: user.id,
        accountId: id,
      });

      if (!data)
        next(
          GeneralErrorsFactory.notFoundErr({
            customMessage: 'No Account Found For Deletion',
          })
        );

      if (!success) throw err;

      const { success: deleteAccountSuccess, err: deleteAccountErr } =
        await GoogleServices.deleteConnectedAccount({
          userId: user.id,
          accountId: id,
        });

      if (!deleteAccountSuccess) throw deleteAccountErr;

      next(
        GeneralResponsesFactory.successResponse({
          data: {},
          statusCode: 200,
          message: 'Account deleted successfully',
          key: 'account',
        })
      );
    } catch (error) {
      next(error);
    }
  }
  
  // Classify emails when requested
  static async processGmailMessages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return next(
          GeneralErrorsFactory.notFoundErr({ customMessage: 'Event not found' })
        );
      }

      const savedEvents = await EmailProcessor.processAndSaveEmails(messages);

      next(
        GeneralResponsesFactory.successResponse({
          data: undefined,   
          statusCode: 200,
          message: 'Gmail classified and saved successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Classify emails automatically while getting them 
  static async classifyGmailMessages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { auth } = googleUtils;
      const pageToken = req.query.pageToken as string | undefined;

      const { success, data, error } = await GoogleServices.getGmailMessages({
        auth,
        pageToken,
      });
      if (!success) throw error;

      const messages = data?.messages || [];

      if (!Array.isArray(messages) || messages.length === 0) {
        return next(
          GeneralErrorsFactory.notFoundErr({ customMessage: 'Event not found' })
        );
      }

      const savedEvents = await EmailProcessor.processAndSaveEmails(messages);

      next(
        GeneralResponsesFactory.successResponse({
          data: {
            nextPageToken: data.nextPageToken || null,
          },
          statusCode: 200,
          message: 'Gmail classified and saved successfully',
        })
      );
    } catch (error) {
      next(error);
    }
  }

}

