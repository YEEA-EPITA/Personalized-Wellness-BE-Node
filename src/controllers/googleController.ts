import { Request, Response, NextFunction } from 'express';
import { GoogleServices } from '../services';
import { GeneralErrorsFactory, GeneralResponsesFactory } from '../factories';
import config from 'config';
import { googleUtils } from '../utils';
import { people as googlePeopleApi } from '@googleapis/people';
import { calendar as googleCalanderApi } from '@googleapis/calendar';
import { google } from 'googleapis';
import crypto from 'crypto';
import { PlatformsModel } from '../models';
import mongoose from 'mongoose';

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
          `${config.get<string>('hostUrl')}/api/v1/auth/google`
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

      return next(
        GeneralResponsesFactory.successResponse({
          data: peopleResponse.data,
          key: 'googleTokens',
          message: 'Google authentication successful',
          statusCode: 200,
        })
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
      console.log('Gmail request confirmed');

      const userId = req.jwtToken?.id;
      console.log('userId:', userId);

      const objectId = new mongoose.Types.ObjectId(userId);
      const platform = await PlatformsModel.findOne({
        type: 'GOOGLE',
        connectorId: objectId,
      });

      console.log('platform:', platform);

      if (!platform || !platform.tokens?.access_token) {
        throw new Error('No Google account connected or missing access token');
      }

      googleUtils.auth.setCredentials({ 
        access_token: platform.tokens.access_token,
        refresh_token: platform.tokens.refresh_token, 
        expiry_date: platform.tokens.expiry_date,
      });

      const tokenInfo = await googleUtils.auth.getTokenInfo(platform.tokens.access_token);
      console.log('tokenInfo:', tokenInfo);

      const messages = await GoogleServices.getGmailMessages({
        access_token: platform.tokens.access_token,
        refresh_token: platform.tokens.refresh_token,
      });

      res.status(200).json({
        statusCode: 200,
        message: 'Gmail messages retrieved successfully',
        data: messages,
      });
    } catch (error) {
      console.error('Error in getGmailMessages:', error);
      console.error('Token is invalid, may need to refresh:', error);
      next(error);
    }
  }
}
