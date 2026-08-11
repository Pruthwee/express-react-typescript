
import express, {Request, Response, Router, Express} from 'express';
import router from './route';
import DBConnect from "./dbConfigs";
import { RequestHandler } from 'express-serve-static-core';
import { ssrRenderer } from './middlewares/ssrRenderer';

// call express
const app: Express = express(); // define our app using express

// configure app to use bodyParser for
// Getting data from body of requests
app.use(express.urlencoded({extended: true}) as RequestHandler);

app.use(express.json() as RequestHandler) 


const port: number = Number(process.env.PORT) || 8050; // set our port

// connect to database. right now it's just working with mongodb
// but in near future it will be configured for other databases as well
DBConnect.dbConnection();

// Serve static files from dist directory
app.use(express.static('dist'));

// REGISTER ROUTES
// all of the routes will be prefixed with /api
const routes: Router[] = Object.values(router);
app.use('/api', routes);

// SSR Middleware - Apply server-side rendering for root and non-API routes
// This enables Azure Static Web Apps SSR support and improves SEO
app.use(ssrRenderer);

// Fallback route for client-side routing (SPA support)
app.get('*', (req: Request, res: Response) => {
    console.log('Serving index.html for:', req.path);
    res.sendFile('index.html', { root: 'dist' });
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log(`App listening on ${port}`);
console.log(`SSR enabled: ${process.env.SSR_ENABLED !== 'false'}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
