interface GeneralConstants {
  tokenExpirationTime: string;
  cookieExpirationTime: number;
  passwordResetTokenExpiry: string;
  accountVerificationTokenExpiry: string;
}

const generalConstants: GeneralConstants = {
  tokenExpirationTime: '1d',
  cookieExpirationTime: 24 * 60 * 60 * 1000,
  passwordResetTokenExpiry: '1h',
  accountVerificationTokenExpiry: '1h',
};

export default generalConstants;
