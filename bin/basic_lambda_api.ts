#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BasicLambdaApiStack } from '../lib/basic_lambda_api-stack';
import { getConfig } from '../lib/config';

const _CONFIG = getConfig();

const app = new cdk.App();
const stackId: string = _CONFIG.APP_NAME + '-stack-' + _CONFIG.APP_STAGE;
new BasicLambdaApiStack(app, stackId, {
  description: 'The ' + _CONFIG.APP_NAME + ' stack for ' + _CONFIG.APP_STAGE + ' environment',
  env: {
    account: _CONFIG.AWS_ACCOUNT_ID,
    region: _CONFIG.AWS_REGION,
  },
  _CONFIG
});