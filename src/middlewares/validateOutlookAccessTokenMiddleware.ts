import { Request, Response, NextFunction } from 'express';
import { PlatformsModel } from '../models';
import { outlookUtils } from '../utils';
import { AuthErrors } from '../factories';
import { platformsConstants } from '../constants';

declare global {
  namespace Express {
    interface Request {
      outlookCredentials?: {
        accessToken: string;
      };
    }
  }
}

const checkTokenExpiryAndRefresh = async ({
  accountId,
  tokenObj,
}: {
  accountId: string;
  tokenObj: Record<string, any>;
}) => {
  try {
    const { refresh_token, expires_in } = tokenObj;
    const isTokenExpired = expires_in * 1000 < Date.now();

    if (!isTokenExpired)
      return { success: true, access_token: tokenObj.access_token };

    const {
      success,
      data: refreshTokenData,
      err,
    } = (await outlookUtils.oAuth.refreshAccessToken({
      refreshToken: refresh_token,
    })) as any;

    if (!success) throw err;

    const newExpiresIn = Date.now() + refreshTokenData?.expires_in * 1000;
    const newTokenObj = {
      access_token: refreshTokenData.access_token,
      refresh_token: refreshTokenData.refresh_token,
      expires_in: newExpiresIn,
    };

    await PlatformsModel.findOneAndUpdate(
      { _id: accountId },
      { $set: { tokens: newTokenObj } },
      { new: true }
    );

    return { success: true, access_token: newTokenObj.access_token };
  } catch (err) {
    return { success: false, err };
  }
};

const validateOutlookAccessTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtToken?.id;

    const findUserConnection = (await PlatformsModel.findOne({
      type: platformsConstants.PLATFORMS.outlook.value,
      connectorId: userId,
    })) as any;

    if (!findUserConnection)
      return next(
        AuthErrors.unauthenticated({
          customMessage: 'Account is not connected',
        })
      );

    const { success, access_token } = await checkTokenExpiryAndRefresh({
      accountId: findUserConnection._id.toString(),
      tokenObj: findUserConnection.tokens,
    });

    if (!success)
      next(
        AuthErrors.unauthenticated({
          customMessage: 'Connection is expired please reauthorized it',
        })
      );

    req.outlookCredentials = { accessToken: access_token };

    next();
  } catch (error) {
    next(error);
  }
};

export default validateOutlookAccessTokenMiddleware;
