/* Imports */
// External libraries

// Internal libraries



/* Global Variables */
const _DEFAULT_HEADERS: DefaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true'
};

/* Type Definitions */
type DefaultHeaders = {
    'Content-Type': string,
    'Access-Control-Allow-Origin': string,
    'Access-Control-Allow-Credentials': string
};

/* Exported Functions */
export const sendResponse = (statusCode: number, body: any, headers: any = _DEFAULT_HEADERS) => {
    return {
        statusCode: statusCode,
        headers: headers,
        body: JSON.stringify(body)
    };
}