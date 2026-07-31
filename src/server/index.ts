
import express, {Request, Response, Router, Express} from 'express';
import router from './route';
import DBConnect from "./dbConfigs";
import { RequestHandler } from 'express-serve-static-core';

// call express
const app: Express = express(); // define our app using express

// configure app to use bodyParser for
// Getting data from body of requests
app.use(express.urlencoded({extended: true}) as RequestHandler);

app.use(express.json() as RequestHandler) 


const port: number = Number(process.env.PORT) || 8050; // set our port
// Serve static files from build directory
// In cloud deployments, this can be configured to serve from a different location
// or assets can be served directly from S3/CloudFront
const staticDir = process.env.STATIC_DIR || 'dist';
app.use(express.static(staticDir));

    // Serve index.html from the configured static directory
    res.sendFile('index.html', { root: staticDir });
    res.sendFile('/dist/index.html');
});

// REGISTER ROUTES
// all of the routes will be prefixed with /api
const routes: Router[] = Object.values(router);
app.use('/api', routes);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log(`App listening on ${port}`);
