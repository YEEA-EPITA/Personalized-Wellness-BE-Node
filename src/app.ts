import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { corsOrigin } from './utils';

import * as v1 from './apiVersions/v1';
import { finalResponseMiddleware, errorMiddleware } from './middlewares';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: corsOrigin, credentials: true }));

v1.prepareV1Routes(app);

app.get('/awake', (req: Request, res: Response) => {
  res.json();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(200).setHeader('Content-Type', 'text/html');
  res.end('<html><body><h1>This is an Express Server</h1></body></html>');
});

app.use(errorMiddleware);
app.use(finalResponseMiddleware);

export default app;
