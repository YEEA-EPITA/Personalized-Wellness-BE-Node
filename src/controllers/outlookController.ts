import { Request, Response, NextFunction } from 'express';
import { JiraServices, OutlookServices } from '../services';
import { GeneralErrorsFactory, GeneralResponsesFactory } from '../factories';
import { outlookUtils } from '../utils';
import { platformsConstants } from '../constants';
import { jwtUtils } from '../utils';
import * as cheerio from 'cheerio';

export default class OutlookController {
  static async generateAuthUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authUrl = outlookUtils.oAuth.authUrl;
      const jwtUser = req.jwtToken;

      const state = jwtUtils.generateToken({
        payload: { userId: jwtUser.id, email: jwtUser.email },
        expiry: '3mins',
      });

      return next(
        GeneralResponsesFactory.successResponse({
          data: authUrl + '&state=' + state,
          message: 'Outlook auth URL generated successfully',
          key: 'url',
          statusCode: 200,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  static async oauthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const state = (req.query.state as string) || '';

      if (!code)
        res.redirect(`${outlookUtils.oAuth.dashboardRedirectUrl}?error=true`);

      const decodedState = jwtUtils.verifyToken({ token: state });

      if (!state || !decodedState)
        return next(
          GeneralErrorsFactory.badRequestErr({
            customMessage: 'Session expired. Please try again',
          })
        );

      // Exchange code for token
      const exchangeCodeRes = await outlookUtils.oAuth.exchangeCodeForToken({
        code,
      });

      if (!exchangeCodeRes.success) throw exchangeCodeRes.err;

      const accessToken = exchangeCodeRes?.data.access_token;
      const refreshToken = exchangeCodeRes?.data.refresh_token;
      const expires_in = exchangeCodeRes?.data.expires_in;
      const convertedExpiresIn = Date.now() + expires_in * 1000;

      const { userId }: any = decodedState;

      // Get mySelf
      const getMySelfRes = await outlookUtils.OutlookAPIs.getMySelf({
        accessToken,
      });
      if (!getMySelfRes.success) throw getMySelfRes.err;

      const mySelf = getMySelfRes.data as any;

      // Prepare data for DB
      const dataForDB = {
        type: platformsConstants.PLATFORMS.outlook.value,
        name: mySelf?.displayName,
        email: mySelf?.mail,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: convertedExpiresIn,
        },
        connectorId: userId,
      };

      // Retrievew token from db
      const getOutlookTokenRes = await OutlookServices.getOutlookToken({
        connectorId: userId,
      });
      if (!getOutlookTokenRes.success) throw getOutlookTokenRes.err;

      // Update token
      if (getOutlookTokenRes.data) {
        const outlookUpdateTokenRes = await OutlookServices.updateOutlookToken({
          connectorId: userId,
          data: dataForDB,
        });
        if (!outlookUpdateTokenRes.success) throw outlookUpdateTokenRes.err;
      } else {
        // Save token
        const outlookUpdateTokenRes = await JiraServices.saveJiraToken({
          data: dataForDB,
        });
        if (!outlookUpdateTokenRes.success) throw outlookUpdateTokenRes.err;
      }

      return res.redirect(
        `${outlookUtils.oAuth.dashboardRedirectUrl}?success=true`
      );
    } catch (err) {
      next(err);
    }
  }

  static async getMails(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.outlookCredentials?.accessToken;
      const limit = parseInt(req.query.limit as string) || 5;

      const getMailsRes = await outlookUtils.OutlookAPIs.getMails({
        accessToken: token as string,
        limit,
      });

      if (!getMailsRes.success) throw getMailsRes.err;

      const mails = getMailsRes.data as any;

      let messages: any[] = [];
      for (const mail of mails.value) {
        const { subject, from, body, receivedDateTime, id } = mail;

        const $ = cheerio.load(body.content);
        const plainText = $.text().replace(/\s+/g, ' ').trim();

        const message = {
          id,
          from,
          receivedDateTime,
          subject,
          message: plainText,
        };
        messages.push(message);
      }

      return next(
        GeneralResponsesFactory.successResponse({
          data: messages,
          message: 'Mails retrieved successfully',
          statusCode: 200,
        })
      );
    } catch (err) {
      next(err);
    }
  }
}
