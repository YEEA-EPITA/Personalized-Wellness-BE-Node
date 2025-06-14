import { Request, Response, NextFunction } from 'express';
import { JiraServices } from '../services';
import { GeneralErrorsFactory, GeneralResponsesFactory } from '../factories';
import { jiraUtils } from '../utils';
import { platformsConstants } from '../constants';
import { jwtUtils } from '../utils';

export default class JiraController {
  static async generateAuthUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authUrl = jiraUtils.oAuth.authUrl;
      const jwtUser = req.jwtToken;

      const state = jwtUtils.generateToken({
        payload: { userId: jwtUser.id, email: jwtUser.email },
        expiry: '3mins',
      });

      return next(
        GeneralResponsesFactory.successResponse({
          data: authUrl + '&state=' + state,
          message: 'Jira auth URL generated successfully',
          key: 'url',
          statusCode: 200,
        })
      );
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async oauthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const state = (req.query.state as string) || '';

      const decodedState = jwtUtils.verifyToken({ token: state });

      if (!state || !decodedState)
        return next(
          GeneralErrorsFactory.badRequestErr({
            customMessage: 'Session expired. Please try again',
          })
        );

      const { userId }: any = decodedState;

      // Exchange code for token
      const {
        success,
        data: exchangeData,
        err,
      } = await jiraUtils.JiraAPIs.exchangeCodeForToken(code);

      if (!success) throw err;

      const accessToken = exchangeData?.access_token;
      const expires_in = exchangeData?.expires_in;
      const convertedExpiresIn = Date.now() + expires_in * 1000;

      // Get resource
      const {
        success: resourceSuccess,
        data: resourceData,
        err: resourceErr,
      } = await jiraUtils.JiraAPIs.getResource({ accessToken });

      if (!resourceSuccess) throw resourceErr;

      // Cloud ID from resource
      let cloudid = '';
      if (Array.isArray(resourceData) && resourceData[0]?.id) {
        cloudid = resourceData[0].id;
      }

      const {
        success: mySelfSuccess,
        data: mySelfData,
        err: mySelfErr,
      } = await jiraUtils.JiraAPIs.getMySelf({
        accessToken,
        cloudId: cloudid,
      });

      if (!mySelfSuccess) throw mySelfErr;

      // Prepare data for DB
      const dataForDB = {
        type: platformsConstants.PLATFORMS.jira.value,
        accountId: mySelfData.accountId,
        name: mySelfData.displayName,
        email: mySelfData.emailAddress,
        cloudId: cloudid,
        tokens: {
          ...exchangeData,
          expires_in: convertedExpiresIn,
        },
        connectorId: userId,
      };

      // Retrievew token from db
      const getJiraTokenRes = await JiraServices.getJiraToken({
        connectorId: userId,
      });
      if (!getJiraTokenRes.success) throw getJiraTokenRes.err;

      // Update token
      if (getJiraTokenRes.data) {
        const updateJiraTokenRes = await JiraServices.updateJiraToken({
          connectorId: userId,
          data: dataForDB,
        });
        if (!updateJiraTokenRes.success) throw updateJiraTokenRes.err;
      } else {
        const updateJiraTokenRes = await JiraServices.saveJiraToken({
          data: dataForDB,
        });
        if (!updateJiraTokenRes.success) throw updateJiraTokenRes.err;
      }

      return next(
        GeneralResponsesFactory.successResponse({
          data: dataForDB,
          message: 'Jira token generated successfully',
          statusCode: 200,
        })
      );
    } catch (err) {
      next(err);
    }
  }
}
