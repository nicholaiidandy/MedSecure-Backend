import crypto from 'crypto';

export const generateBlockchainHash = (data: any): string => {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
};
