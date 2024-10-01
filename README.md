# BasicLambdaApi #
Contains a TypeScript AWS project with a simple set of CRUD Rest APIs routed through API Gateway to Lambda Handlers which perform respective actions on a DynamoDB table. It is built using the AWS CDK.

# Steps to Deploy #
## Prerequisites [If Needed] ##
1. IAM User and AWS CLI Privileges
    1. Create User in AWS IAM Service for CLI Access in your AWS Region
    2. Attach AdministratorAccess Policy to the User
    3. Navigate to the User's Security Credentials and Create an Access Key and Secret Key for CLI Access
    4. [!IMPORTANT] Save the Access Key and Secret Key in a secure location
2. [Optional] Create a budget in AWS Budgets Service to monitor costs
    1. Navigate to Billing and Cost Management Service
    2. Select Budgets and Create a Budget
    3. Use a template and select "Zero Spend Budget" to monitor costs

## Steps ##
1. Clone the repository
2. Navigate to the project directory
3. Run `npm install` to install the project dependencies
4. Modify the stored `.env` file with your values
5. [If Needed] Run `aws configure` to configure your AWS CLI with the Access Key and Secret Key for the IAM User
6. [If Needed] Run `cdk bootstrap` to bootstrap the AWS CDK in your AWS Account
7. Run `cdk deploy && npm run test` to deploy the stack and run the tests for stack validation
8. View CLI Output for the API Gateway ID. Use this ID to test the API via the Postman Collection

## Postman Collection ##
The Postman Collection is located in the `postman` directory. It contains a set of CRUD API requests to test the API Gateway. The collection is pre-configured to use the API Gateway ID as a variable. You can modify the variable to use your API Gateway ID created by the stack.
1. Import the Postman Collection into Postman
2. Modify the API Gateway ID variable in the collection variables to use your API Gateway ID
3. Run the requests in the collection to test the API

## Cleanup ##
1. Run `cdk destroy` to destroy the stack and remove all resources created by the stack

## Notes ##
There are several changes that can be made to this "application" to make it more production-ready. Some of these changes include:
1. Implementing a CI/CD Pipeline for the project.
    - I would leverage the CDK, Jest, and GitHub Actions to create a CI/CD Pipeline for this project. This would allow for automated testing and deployment of the project.
    - More Unit Test, Postman Tests, etc...
2. Implementing a Logging and Monitoring Solution for the project.
    - I would leverage CloudWatch Logs and Metrics to monitor the project.
3. Implementing Authentication and Authorization for the project.
    - I would leverage Cognito User Pools and Identity Pools to implement authentication and authorization for the project.
4. TypeScript
    - Linting: I would leverage ESLint to lint the TypeScript code in the project. I haven't used it before, but believe this is the most common tool
    - Typing/Interfaces: I would implement interfaces for the request and response objects in the project. This would help with type checking and code readability.
    - Testing: I would implement unit tests for the Lambda Handlers in the project.
5. I would not commit the .env to the repository. Potentially, I would store them more securely for BE usage in either AWS Secrets Manager or AWS Parameter Store.
    