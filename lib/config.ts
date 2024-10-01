import * as dotenv from 'dotenv';
import path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type ConfigProps = {
    APP_NAME: string;
    APP_VERSION: string;
    APP_STAGE: string;

    AWS_REGION: string;
    AWS_ACCOUNT_ID: string;
}

export const getConfig = (): ConfigProps => {
    return {
        APP_NAME: process.env.APP_NAME || '',
        APP_VERSION: process.env.APP_VERSION || '',
        APP_STAGE: process.env.APP_STAGE || 'dev',

        AWS_REGION: process.env.AWS_REGION || '',
        AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID || '',
    };
}