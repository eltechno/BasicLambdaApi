/* Imports */
// External libraries
import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

// Internal libraries
import { ConfigProps } from './config';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path = require('path');

/* Global Variables */

/* Type Definitions */
type EnvStackProps = StackProps & {
  _CONFIG: Readonly<ConfigProps>;
}

/* Stack Definition */
export class BasicLambdaApiStack extends Stack {
  constructor(scope: Construct, id: string, props: EnvStackProps) {
    super(scope, id, props);

    const stage: string = props._CONFIG.APP_STAGE;

    /***********************/
    /*    BEGIN DYNAMODB   */
    /***********************/
    /* Default values */
    let defMinReadCapacity: number = 5;
    let defMaxReadCapacity: number = 10;
    let defMinWriteCapacity: number = 1;
    let defMaxWriteCapacity: number = 3;
    if (stage == 'prod') {
      defMinReadCapacity = 5;
      defMaxReadCapacity = 20;
      defMinWriteCapacity = 1;
      defMaxWriteCapacity = 5;
    }

    /* Create DynamoDb Tables */
    let tableName: string = 'location-table-' + stage;
    const locationTable = new dynamodb.Table(this, tableName, {
      partitionKey: {
        name: "locationId", // RANDOM UUID HEX VALUE
        type: dynamodb.AttributeType.STRING
      },
      tableName: tableName,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: defMinReadCapacity,
      writeCapacity: defMinWriteCapacity,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY
    });

    /* Auto-scaling */
    const readCapacity = locationTable.autoScaleReadCapacity({
      minCapacity: defMinReadCapacity,
      maxCapacity: defMaxReadCapacity
    });
    readCapacity.scaleOnUtilization({
      targetUtilizationPercent: 70
    });

    const writeCapacity = locationTable.autoScaleWriteCapacity({
      minCapacity: defMinWriteCapacity,
      maxCapacity: defMaxWriteCapacity
    });
    writeCapacity.scaleOnUtilization({
      targetUtilizationPercent: 70
    });

    /***********************/
    /*     BEGIN LAMBDA    */
    /***********************/

    /* Create Lambda functions */
    // GET
    let handlerName: string = "getLocation"
    let functionName: string = handlerName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) + '-' + stage;
    const getLocationHandler = new NodejsFunction(this, functionName, {
      functionName: functionName,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/handlers/apiGwHandlers.ts'),
      handler: handlerName,
      environment: {
        LOCATION_TABLE_NAME: locationTable.tableName
      }
    });

    // GET ALL
    handlerName = "getLocations"
    functionName = handlerName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) + '-' + stage;
    const getLocationsHandler = new NodejsFunction(this, functionName, {
      functionName: functionName,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/handlers/apiGwHandlers.ts'),
      handler: handlerName,
      environment: {
        LOCATION_TABLE_NAME: locationTable.tableName
      }
    });

    // POST
    handlerName = "createLocation"
    functionName = handlerName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) + '-' + stage;
    const createLocationHandler = new NodejsFunction(this, functionName, {
      functionName: functionName,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/handlers/apiGwHandlers.ts'),
      handler: handlerName,
      environment: {
        LOCATION_TABLE_NAME: locationTable.tableName
      }
    });

    // PATCH
    handlerName = "updateLocation"
    functionName = handlerName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) + '-' + stage;
    const updateLocationHandler = new NodejsFunction(this, functionName, {
      functionName: functionName,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/handlers/apiGwHandlers.ts'),
      handler: handlerName,
      environment: {
        LOCATION_TABLE_NAME: locationTable.tableName
      }
    });

    // DELETE
    handlerName = "deleteLocation"
    functionName = handlerName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) + '-' + stage;
    const deleteLocationHandler = new NodejsFunction(this, functionName, {
      functionName: functionName,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/handlers/apiGwHandlers.ts'),
      handler: handlerName,
      environment: {
        LOCATION_TABLE_NAME: locationTable.tableName
      }
    });

    /***********************/
    /*  BEGIN PERMISSIONS  */
    /***********************/
    locationTable.grantReadData(getLocationHandler);
    locationTable.grantReadData(getLocationsHandler);
    locationTable.grantReadWriteData(createLocationHandler);
    locationTable.grantReadWriteData(updateLocationHandler);
    locationTable.grantReadWriteData(deleteLocationHandler);

    /***********************/
    /*  BEGIN API GATEWAY  */
    /***********************/

    /* Create API Gateway */
    let apiGwName: string = 'central-api-gw-' + stage;
    const apiGw = new apigateway.RestApi(this, apiGwName, {
      restApiName: apiGwName,
      description: 'Central API Gateway for ' + stage + ' environment to route requests to Lambda functions',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS
      },
      deployOptions: {
        stageName: stage
      }
    });

    /* Create API Gateway Resources */

// Create the 'locations' resource
  const locations = apiGw.root.addResource('locations');

  // Define the '{locationId}' resource under 'locations'
  const locationId = locations.addResource('{locationId}');

  // Add methods to the 'locations' resource
  locations.addMethod('GET', new apigateway.LambdaIntegration(getLocationsHandler));
  locations.addMethod('POST', new apigateway.LambdaIntegration(createLocationHandler));

  // Add methods to the '{locationId}' resource
  locationId.addMethod('GET', new apigateway.LambdaIntegration(getLocationHandler));
  locationId.addMethod('PATCH', new apigateway.LambdaIntegration(updateLocationHandler));
  locationId.addMethod('DELETE', new apigateway.LambdaIntegration(deleteLocationHandler));

    /***********************/
    /*    BEGIN OUTPUTS    */
    /***********************/
    new CfnOutput(this, 'LocationTable', {
      value: locationTable.tableName ?? 'Build Failed: Something went wrong with the deployment',
      description: 'Location Table Name'
    });

    new CfnOutput(this, 'CentralApiGwUrl', {
      value: apiGw.url ?? 'Build Failed: Something went wrong with the deployment',
      description: 'Central API Gateway URL'
    });

    // Lambda Function Name Outputs
    new CfnOutput(this, 'GetLocationHandler', {
      value: getLocationHandler.functionName ?? 'Build Failed: Something went wrong with the deployment',
      description: 'GET Location Lambda Function Name'
    });

    new CfnOutput(this, 'GetAllLocationsHandler', {
      value: getLocationsHandler.functionName ?? 'Build Failed: Something went wrong with the deployment',
      description: 'GET ALL Locations Lambda Function Name'
    });

    new CfnOutput(this, 'CreateLocationHandler', {
      value: createLocationHandler.functionName ?? 'Build Failed: Something went wrong with the deployment',
      description: 'CREATE Location Lambda Function Name'
    });

    new CfnOutput(this, 'UpdateLocationHandler', {
      value: updateLocationHandler.functionName ?? 'Build Failed: Something went wrong with the deployment',
      description: 'UPDATE Location Lambda Function Name'
    });

    new CfnOutput(this, 'DeleteLocationHandler', {
      value: deleteLocationHandler.functionName ?? 'Build Failed: Something went wrong with the deployment',
      description: 'DELETE Location Lambda Function Name'
    });

  }

}