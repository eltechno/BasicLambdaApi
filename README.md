# Basic Lambda API with DynamoDB and API Gateway


Part of this code is based on the 

# AWS CDK Immersion Day Workshop

[link](https://catalog.us-east-1.prod.workshops.aws/workshops/10141411-0192-4021-afa8-2436f3c66bd8/en-US)

This project defines an AWS CDK stack that provisions an API Gateway with Lambda functions connected to a DynamoDB table. The API provides CRUD operations (Create, Read, Update, Delete) for managing locations, with each resource being backed by a Lambda function and DynamoDB table.

## Features

- **DynamoDB**: A table with auto-scaling read and write capacities based on the environment (e.g., `prod`, `dev`).
- **Lambda Functions**: Functions to handle location management (create, get, update, delete).
- **API Gateway**: Exposes Lambda functions as REST API endpoints for interacting with the location data.
- **CloudFormation Outputs**: Useful outputs such as DynamoDB table name, API Gateway URL, and Lambda function names.

## File Structure

- `basic_lambda_api-stack.ts`: The main CDK stack that defines resources like DynamoDB, Lambda functions, and API Gateway.
- `config.ts`: Contains configuration values for different stages (not included in the code).
- `src/`: Directory where Lambda handler files are stored (e.g., `get-location.ts`, `create-location.ts`, etc.).

## Prerequisites

Before deploying the stack, ensure you have the following installed:

- **Node.js** (>= 14.x)
- **AWS CDK** (>= 2.x)
- **AWS CLI** (configured with the proper IAM permissions)
- **TypeScript** (optional, for development)

## Setup

1. Clone this repository to your local machine:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Build the project:
    ```bash
    npm run build
    ```

4. Synthesize the CloudFormation template:
    ```bash
    cdk synth
    ```

## Deployment

To deploy the stack, follow these steps:

1. Bootstrapping the AWS environment (if not already done):
    ```bash
    cdk bootstrap aws://<account-id>/<region>
    ```

2. Deploy the stack:
    ```bash
    cdk deploy
    ```

   This will create the necessary resources on AWS (DynamoDB, Lambda functions, and API Gateway).

## API Endpoints

Once the stack is deployed, the following API endpoints will be available:

- `GET /locations`: Retrieve all locations.
- `POST /locations`: Create a new location.
- `GET /locations/{locationId}`: Retrieve a specific location by ID.
- `PATCH /locations/{locationId}`: Update a location by ID.
- `DELETE /locations/{locationId}`: Delete a location by ID.

## Environment-Specific Configuration

The code includes different configurations for different stages (`prod`, `dev`, etc.). These configurations affect DynamoDB read and write capacities. Make sure to define the `_CONFIG` object in `config.ts` that includes `APP_STAGE` to control the environment:

Example:
```ts
export const config: ConfigProps = {
  APP_STAGE: 'dev' // or 'prod'
};
```

## Outputs

Once the deployment is complete, the following outputs will be available:

- **LocationTable**: The name of the DynamoDB table created.
- **CentralApiGwUrl**: The base URL of the API Gateway.
- **Lambda Function Names**: Names of all the Lambda functions created for the API.

## Cleanup

To remove the stack and all associated resources from your AWS account:

```bash
cdk destroy
```

---