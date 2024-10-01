/* Imports */
// External libraries
import { APIGatewayEvent, Handler, Context } from 'aws-lambda';
import axios from 'axios';
import * as AWS from 'aws-sdk';

// Internal libraries
import { sendResponse } from '../utils/apiGwUtils';
import { getConfig } from '../../lib/config';
import { randomBytes } from 'crypto';

/* Global Variables */
const _CONFIG = getConfig();

AWS.config.update({ region: _CONFIG.AWS_REGION });
const ddb = new AWS.DynamoDB.DocumentClient();

/* Exported Functions */
/**
 * This function will retrieve all locations from the Location Table in DynamoDB.
 * 
 * @returns `{statusCode: number, headers: any, data: any | error: any}`
 */
export const getLocations: Handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        // Retrieve the table name from the environment variables and verify that it is defined
        const tableName: string = process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME';
        if (tableName === 'UNDEFINED_TABLE_NAME') {
            throw new Error("Table name is not defined in environment variables. Verify CloudFormation stack.");
        }

        // Define the parameters for the DynamoDB Table
        const params = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME'
        };

        // Retrieve the data from the DynamoDB Table
        const data = await ddb.scan(params).promise();

        // Verify that the data object is not empty
        if (!data.Items) {
            throw new Error("No items were found in the DynamoDB Table.");
        }

        // Iterate through the data object and store the items in an array
        const locationItems = data.Items.map((item) => item);

        // TODO: Potentially break the response object into a type
        return sendResponse(
            200,
            {
                'data': locationItems,
                'meta': {
                    'userMsg': "The 'Locations' were successfully retrieved."
                }
            }
        );

    } catch (error) {
        // TODO: Potentially break the response object into a interface
        return sendResponse(
            500,
            {
                'error': {
                    'logMsg': "An error occurred while retrieving the locations.",
                    'error': String(error)
                },
                'meta': {
                    'userMsg': "An error occurred while retrieving the locations. Please try again later."
                }
            }
        );
    }
}

/**
 * This function will retrieve a single location from the Location Table in DynamoDB.
 * 
 * @param locationId(required | pathParameter | string) The ID of the location to retrieve
 * 
 * @returns `{statusCode: number, headers: any, data: any | error: any}`
 */
export const getLocation: Handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        // Retrieve the table name from the environment variables and verify that it is defined
        const tableName: string = process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME';
        if (tableName === 'UNDEFINED_TABLE_NAME') {
            throw new Error("Table name is not defined in environment variables. Verify CloudFormation stack.");
        }

        // Retrieve the locationId from the path parameters
        const locationId: string = event.pathParameters?.locationId || '';

        if (!locationId || locationId === '') {
            throw new Error("The 'locationId' path parameter is not defined.");
        }

        // Define the parameters for the DynamoDB Table
        const params = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME',
            Key: {
                'locationId': locationId
            }
        };

        // Retrieve the data from the DynamoDB Table
        const locationItem = await ddb.get(params).promise();

        // Verify that the data object is not empty
        if (!locationItem.Item) {
            // Ideally I would throw a 404 error here, sendResponse would be abstracted to handle this
            throw new Error("No item was found in the DynamoDB Table.");
        }

        // TODO: Potentially break the response object into a type
        return sendResponse(
            200,
            {
                'data': locationItem.Item,
                'meta': {
                    'userMsg': "The 'Location' was successfully retrieved."
                }
            }
        );

    } catch (error) {
        // TODO: Potentially break the response object into a interface
        return sendResponse(
            500,
            {
                'error': {
                    'logMsg': "An error occurred while retrieving the location.",
                    'error': String(error)
                },
                'meta': {
                    'userMsg': "An error occurred while retrieving the location. Please try again later."
                }
            }
        );
    }
}

/**
 * This function will create a new location in the Location Table in DynamoDB.
 * It takes in country, state, and city as required body parameters as they are used
 * to query the nominatim.openstreetmap API to retrieve the latitude and longitude data
 * which is then stored in the DynamoDB Table.
 * 
 * @param country(required | body | string) - The country of the location to search
 * @param state(required | body | string) - The state of the location to search
 * @param city(required | body | string) - The city of the location to search
 * @param format(optional | body | string) - The format of the response. [Default: json]
 * 
 * @returns `{statusCode: number, headers: any, data: any | error: any}`
 */
export const createLocation: Handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        // Retrieve the table name from the environment variables and verify that it is defined
        const tableName: string = process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME';
        if (tableName === 'UNDEFINED_TABLE_NAME') {
            throw new Error("Table name is not defined in environment variables. Verify CloudFormation stack.");
        }

        // Retrieve the body from the event and verify that it is defined
        const body: string = event.body || '';
        if (!body || body === '') {
            throw new Error("The 'body' of the request is not defined.");
        }

        const payload: any = JSON.parse(body);
        if (!payload) {
            throw new Error("The 'body' of the request is not defined.");
        }


        // Retrieve the required parameters from the body
        const country: string = payload.country || '';
        const state: string = payload.state || '';
        const city: string = payload.city || '';

        // Retrieve the optional parameters from the body
        const format: string = payload.format || 'json';

        // Verify that the required parameters are defined
        if (!country || country === '' || !state || state === '' || !city || city === '') {
            throw new Error("The 'country', 'state', and 'city' body parameters are required.");
        }

        // Define the request parameters for the third-party API
        const requestUrl: string = 'https://nominatim.openstreetmap.org/search'
        const requestQueryParams: any = {
            'city': city,
            'state': state,
            'country': country,
            'format': format
        };
        const requestHeaders: any = {
            'User-Agent': _CONFIG.APP_NAME + "-" + _CONFIG.APP_VERSION
        };

        // Make the request to the third-party API
        const response = await axios.get(requestUrl, {
            params: requestQueryParams,
            headers: requestHeaders
        });

        // Verify that the data object is not empty
        if (!response.data || response.data.length === 0) {
            throw new Error("No data was found from downstream in the third-party API.");
        }

        // TODO: Potential Interface Definition
        const location: any = response.data[0];

        // Define the bounding box array to prepare the item for DynamoDB Table (Not needed anymore because of change in params object)
        let boundingBox: any[] = [];
        if (location.boundingbox && location.boundingbox.length > 0) {
            for (let i = 0; i < location.boundingbox.length; i++) {
                boundingBox.push(location.boundingbox[i]);
            }
        }

        // Random UUID HEX String 
        const locationId: string = randomBytes(16).toString('hex');

        // Define the parameters for the DynamoDB Table
        const params = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME',
            Item: {
                'locationId': String(locationId),
                'placeId': String(location.place_id) || "0",
                'license': location.licence || 'Unknown',
                'osmType': location.osm_type || 'Unknown',
                'osmId': String(location.osm_id) || "0",
                'lat': location.lat || 'Unknown',
                'lon': location.lon || 'Unknown',
                'class': location.class || 'Unknown',
                'type': location.type || 'Unknown',
                'placeRank': Number(location.place_rank) || 0,
                'importance': Number(location.importance) || 0,
                'addressType': location.addresstype || 'Unknown',
                'name': location.name || 'Unknown',
                'displayName': location.display_name || 'Unknown',
                'boundingBox': boundingBox
            }
        };

        // Store the data in the DynamoDB Table
        await ddb.put(params).promise();

        // Get the item from the DynamoDB Table
        const getItemParams = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME',
            Key: {
                'locationId': locationId
            }
        };

        // Retrieve the data from the DynamoDB Table
        const locationItem = await ddb.get(getItemParams).promise();

        // Verify that the data object is not empty
        if (!locationItem.Item) {
            // Ideally I would throw a 404 error here, sendResponse would be abstracted to handle this
            throw new Error("No item was found in the DynamoDB Table.");
        }


        // TODO: Potentially break the response object into a type
        return sendResponse(
            200,
            {
                'data': locationItem.Item,
                'meta': {
                    'userMsg': "The 'Location' was successfully created."
                }
            }
        );

    } catch (error) {
        // TODO: Potentially break the response object into a interface
        return sendResponse(
            500,
            {
                'error': {
                    'logMsg': "An error occurred while creating the location.",
                    'error': String(error)
                },
                'meta': {
                    'userMsg': "An error occurred while creating the location. Please try again later."
                }
            }
        );
    }
}

/**
 * This function will update a location in the Location Table in DynamoDB.
 *  
 * @param locationId(required | pathParameter | string) The ID of the location to update
 * @param $attribute (required | body | any) The name of any attribute on the object to update in the location item
 * 
 * @returns `{statusCode: number, headers: any, data: any | error: any}`
 */
export const updateLocation: Handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        // Retrieve the table name from the environment variables and verify that it is defined
        const tableName: string = process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME';
        if (tableName === 'UNDEFINED_TABLE_NAME') {
            throw new Error("Table name is not defined in environment variables. Verify CloudFormation stack.");
        }

        // Retrieve the locationId from the path parameters
        const locationId: string = event.pathParameters?.locationId || '';

        if (!locationId || locationId === '') {
            throw new Error("The 'locationId' path parameter is not defined.");
        }

        // Retrieve the body from the event and verify that it is defined
        const body = event.body || '';
        if (!body || body === '') {
            throw new Error("The 'body' of the request is not defined.");
        }

        const payload: any = JSON.parse(body);
        if (!payload) {
            throw new Error("The 'body' of the request is not defined.");
        }

        // Get the item from the DynamoDB Table
        const getItemParams = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME',
            Key: {
                'locationId': locationId
            }
        };

        let updateExpression: string = 'set';
        let ExpressionAttributeNames: any = {};
        let ExpressionAttributeValues: any = {};
        for (const property in payload) {
            // Exclude the locationId from the update
            if (property === 'locationId') {
                continue;
            }
            updateExpression += ` #${property} = :${property} ,`;
            ExpressionAttributeNames['#' + property] = property;
            ExpressionAttributeValues[':' + property] = payload[property];
        }

        // Define the parameters for the DynamoDB Table
        const params = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME',
            Key: {
                'locationId': locationId
            },
            UpdateExpression: updateExpression.slice(0, -1),
            ExpressionAttributeNames: ExpressionAttributeNames,
            ExpressionAttributeValues: ExpressionAttributeValues
        };
        // Update the data in the DynamoDB Table
        await ddb.update(params).promise();

        // Get the item from the DynamoDB Table
        const locationItem: any = await ddb.get(getItemParams).promise();

        // Verify that the data object is not empty
        if (!locationItem.Item) {
            // Ideally I would throw a 404 error here, sendResponse would be abstracted to handle this
            throw new Error("No item was found in the DynamoDB Table.");
        }

        // TODO: Potentially break the response object into a type
        return sendResponse(
            200,
            {
                'data': locationItem.Item,
                'meta': {
                    'userMsg': "The 'Location' was successfully updated."
                }
            }
        );

    } catch (error) {
        // TODO: Potentially break the response object into a interface
        return sendResponse(
            500,
            {
                'error': {
                    'logMsg': "An error occurred while updating the location.",
                    'error': String(error)
                },
                'meta': {
                    'userMsg': "An error occurred while updating the location. Please try again later."
                }
            }
        );

    }
}

/**
 * This function will delete a location in the Location Table in DynamoDB.
 * 
 * @param locationId(required | pathParameter | string) The ID of the location to delete
 * 
 * @returns `{statusCode: number, headers: any, data: any | error: any}`
 */
export const deleteLocation: Handler = async (event: APIGatewayEvent, context: Context) => {
    try {
        // Retrieve the table name from the environment variables and verify that it is defined
        const tableName: string = process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME';
        if (tableName === 'UNDEFINED_TABLE_NAME') {
            throw new Error("Table name is not defined in environment variables. Verify CloudFormation stack.");
        }

        // Retrieve the locationId from the path parameters
        const locationId: string = event.pathParameters?.locationId || '';

        if (!locationId || locationId === '') {
            throw new Error("The 'locationId' path parameter is not defined.");
        }

        // Get the item from the DynamoDB Table
        const getItemParams = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME',
            Key: {
                'locationId': locationId
            }
        };
        const locationItem: any = await ddb.get(getItemParams).promise();

        // Verify that the data object is not empty
        if (!locationItem.Item) {
            // Ideally I would throw a 404 error here, sendResponse would be abstracted to handle this
            throw new Error("No item was found in the DynamoDB Table.");
        }

        // Define the parameters for the DynamoDB Table
        const params = {
            TableName: process.env.LOCATION_TABLE_NAME || 'UNDEFINED_TABLE_NAME',
            Key: {
                'locationId': locationId
            }
        };

        // Delete the data in the DynamoDB Table
        await ddb.delete(params).promise();

        // TODO: Potentially break the response object into a type
        return sendResponse(
            200,
            {
                'data': locationItem.Item,
                'meta': {
                    'userMsg': "The 'Location' was successfully deleted."
                }
            }
        );

    } catch (error) {
        // TODO: Potentially break the response object into a interface
        return sendResponse(
            500,
            {
                'error': {
                    'logMsg': "An error occurred while deleting the location.",
                    'error': String(error)
                },
                'meta': {
                    'userMsg': "An error occurred while deleting the location. Please try again later."
                }
            }
        );
    }
}