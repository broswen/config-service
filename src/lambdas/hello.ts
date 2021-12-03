'use strict';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import ConfigService from "../services/ConfigService";


const ddbClient: DynamoDBClient = new DynamoDBClient({})

const configService: ConfigService = new ConfigService(ddbClient, process.env.CONFIGTABLE ?? 'table')
module.exports.handler = async () => {
  console.log('starting lambda...')
  // set parameters without group
  await configService.SetParameter('test', 'regular test')
  await configService.SetParameter('test2', '')
  // set parameters with group1
  await configService.SetParameter('test', 'group test', 'group1')
  await configService.SetParameter('test2', 'group test 2', 'group1')
  console.log(await configService.GetParameter('test'))
  // get parameter from specific group
  console.log(await configService.GetParameter('test', 'group1'))
  // get parameter group
  console.log(await configService.GetParameterGroup('group1'))
  return
};
