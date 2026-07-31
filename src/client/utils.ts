interface IApi {
    host: string;
    getRoute: (routeName: string) => string;
}

class Api implements IApi {
    host: string;
    constructor(host: string) {
        this.host = host;
    }

    getRoute(routeName: string) {
        return `${this.host}/api/${routeName}`
    }

}

// API host URL is now externalized to environment variables
// In AWS, this should be populated from Systems Manager Parameter Store
// Example: AWS_API_HOST parameter from Parameter Store
// For React apps, use REACT_APP_ prefix for environment variables
const API_HOST = process.env.REACT_APP_API_HOST || process.env.API_HOST || "http://localhost:3000";
const apiRoute: Api = Object.freeze(new Api(API_HOST));

export {
    apiRoute,
}
