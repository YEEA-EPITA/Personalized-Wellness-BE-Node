import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import config from 'config';
import { generalConstant } from '../constants';

interface TokenPayload {
  [key: string]: any; // Or define a specific structure for your payload
}

interface GenerateTokenParams {
  payload: TokenPayload;
  expiry?: string | number;
}

interface VerifyTokenParams {
  token: string;
}

const generateToken = ({ payload, expiry }: GenerateTokenParams): string => {
  const secret = config.get<string>('jwtPrivateKey');
  const options: SignOptions = {
    expiresIn: (expiry ||
      generalConstant.tokenExpirationTime) as SignOptions['expiresIn'],
  };

  const token = jwt.sign(payload, secret, options);
  return token;
};

const verifyToken = ({
  token,
}: VerifyTokenParams): JwtPayload | string | false => {
  try {
    const decodedObj = jwt.verify(token, config.get<string>('jwtPrivateKey'));
    return decodedObj;
  } catch (err) {
    return false;
  }
};

export default { generateToken, verifyToken };
