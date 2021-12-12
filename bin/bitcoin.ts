#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BitcoinFullNodeStack } from '../lib/bitcoin-full-node';

const app = new cdk.App();
new BitcoinFullNodeStack(app, 'TestStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
