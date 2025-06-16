import { Request, Response, NextFunction } from 'express';
import { PlatformsModel } from '../models';
import { googleUtils } from '../utils';
import { AuthErrors } from '../factories';
import { platformsConstants } from '../constants';

const { auth } = googleUtils;

interface TokenObject {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  refresh_token_expires_in?: number;
  expiry_date?: number;
}

interface CheckTokenExpiryAndRefreshParams {
  accountId: string | undefined;
  tokenObj: TokenObject;
}

const checkTokenExpiryAndRefresh = async ({
  accountId,
  tokenObj,
}: CheckTokenExpiryAndRefreshParams): Promise<{ success: boolean }> => {
  try {
    const isTokenExpired =
      tokenObj?.expiry_date && tokenObj.expiry_date < Date.now();

    auth.setCredentials(tokenObj);
    if (!isTokenExpired) return { success: true };

    // Refresh token
    const refreshedToken = await auth.refreshAccessToken();

    const updateResult = await PlatformsModel.updateOne(
      { _id: accountId },
      { tokens: refreshedToken.credentials },
      { new: true }
    );

    if (updateResult.modifiedCount === 0) return { success: false };

    return { success: true };
  } catch (err) {
    return { success: false };
  }
};

const validateGoogleAccessTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtToken?.id;

    const findUserConnection = await PlatformsModel.findOne({
      type: platformsConstants.PLATFORMS.google.value,
      connectorId: userId,
    });

    if (!findUserConnection)
      return next(
        AuthErrors.unauthenticated({
          customMessage: 'Account is not connected',
        })
      );

    const { success } = await checkTokenExpiryAndRefresh({
      accountId: findUserConnection?._id?.toString(),
      tokenObj: findUserConnection.tokens,
    });

    if (!success)
      return next(
        AuthErrors.unauthenticated({
          customMessage: 'Token is expired please reauthorized it',
        })
      );
    
    const tokens = findUserConnection.tokens;
    googleUtils.auth.setCredentials(tokens);
    console.log('Token is valid, proceeding to next');
    next();
  } catch (error) {
    console.error('Error in validateGoogleAccessTokenMiddleware:', error);
    next(error);
  }
};

export default validateGoogleAccessTokenMiddleware;
