import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput, QueryCommand, QueryCommandInput, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { Parameter, ParameterGroup } from "../models";

export default class ConfigService {
  private ddbClient: DynamoDBClient
  private table: string
  constructor(ddbClient: DynamoDBClient, table: string) {
    this.ddbClient = ddbClient
    this.table = table
  }

  async GetParameter(name: string, group?: string): Promise<Parameter | undefined> {
    const getItemInput: GetItemCommandInput = {
      TableName: this.table,
      Key: {
        PK: {
          S: group === undefined ? `P#${name}` : `G#${group}`
        },
        SK: {
          S: `P#${name}`
        }
      }
    }

    const getItemResult = await this.ddbClient.send(new GetItemCommand(getItemInput))
    if (getItemResult.Item === undefined) {
      return undefined
    }
    const parameter: Parameter = {
      name,
      value: getItemResult.Item.value.S || '',
    }

    return parameter

  }

  async SetParameter(name: string, value: string, group?: string): Promise<Parameter | undefined> {
    const parameter: Parameter = {
      name,
      value
    }
    const putItemInput: PutItemCommandInput = {
      TableName: this.table,
      Item: {
        PK: {
          S: group === undefined ? `P#${parameter.name}` : `G#${group}`
        },
        SK: {
          S: `P#${parameter.name}`
        },
        name: {
          S: parameter.name
        },
        value: {
          S: parameter.value
        },
        group: {
          S: group || ''
        }
      }
    }

    await this.ddbClient.send(new PutItemCommand(putItemInput))

    return parameter
  }

  async GetParameterGroup(group: string): Promise<ParameterGroup> {
    const parameterGroup: ParameterGroup = {
      group,
      parameters: []
    }
    const queryInput: QueryCommandInput = {
      TableName: this.table,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'PK'
      },
      ExpressionAttributeValues: {
        ':pk': {
          S: `G#${group}`
        }
      }
    }

    let queryResult: QueryCommandOutput
    const parameters: Parameter[] = []
    do {
      queryResult = await this.ddbClient.send(new QueryCommand(queryInput))
      parameters.push(...queryResult.Items?.map(item => ({ name: item.name.S, value: item.value.S || '' } as Parameter)) || [])
      queryInput.ExclusiveStartKey = queryResult.LastEvaluatedKey
    } while (queryResult.LastEvaluatedKey !== undefined)

    parameterGroup.parameters = parameters

    return parameterGroup
  }

}