import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import {
  app as azureApp,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import * as http from 'http';
import pontus from './index'
import { register } from './generated';
// import { authenticateToken } from './service/AuthUserService';
import { DASHBOARDS, GROUPS_DASHBOARDS, GROUPS_USERS } from './consts';
import { checkPermissions } from './service/AuthGroupService';
import { authenticateToken } from './service/AuthUserService';

export const app = express();

const port = 8080;

app.use(cors());

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const replaceSlashes = (str: string) => {
    return str.replace(/\//g, '');
  };
  const path = replaceSlashes(req.path);

  if (
    path === replaceSlashes('/PontusTest/1.0.0//register/admin') ||
    path === replaceSlashes('/PontusTest/1.0.0//register/user') ||
    path === replaceSlashes('/PontusTest/1.0.0//login') ||
    path === replaceSlashes('/PontusTest/1.0.0/logout')
  ) {
    return next();
  }

  try {

    const authorization = await authenticateToken(req, res);

    const userId = authorization?.['userId'];

    const arr = req.path.split('/');

    const crudAction = arr[arr.length - 1];

    const entity = arr[arr.length - 2];

    const tableName = entity === 'dashboard' || 'dashboards' ? DASHBOARDS : GROUPS_USERS;

    let targetId = '';

    if (path === replaceSlashes('/PontusTest/1.0.0/dashboard/create')) {
      return next();
    }

    if (req.path.startsWith('/PontusTest/1.0.0/dashboard/')) {
      targetId = req.body?.['id'];
    }

    const permissions = await checkPermissions(userId, targetId, tableName);
    if (
      path === replaceSlashes('/PontusTest/1.0.0//dashboards/read') ||
      path === replaceSlashes('/PontusTest/1.0.0//tables/read')
    ) {
      return next();
    }

    if (permissions[crudAction]) {
      // if (permissions['']) {
      next();
    } else {
      throw { code: 401, message: 'You do not have this permission' };
    }
  } catch (error) {
    console.log({ error })
    res.status(error?.code).json(error?.message);
  }
};

app.use(express.json());

app.use(authMiddleware);

register(app, { pontus });

const validate = (_request, _scopes, _schema) => {
  return true;
};

export const srv = http.createServer(app).listen(port, function() {
  console.log(
    'Your server is listening on port %d (http://localhost:%d)',
    port,
    port,
  );
});

const httpTrigger = async (
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> => {

  context.log(`Http function processed request for url "${request.url}"`);

  srv.closeIdleConnections();

  const data = await request.text();
  const url = new URL(request.url);

  const headers: HeadersInit = {};
  // const headers: http.OutgoingHttpHeaders = {};

  request.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });

  const reqOpts: http.RequestOptions = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: request.method,
    headers: headers,
  };

  const ret = await fetch(
    // 'http://localhost:8080/PontusTest/1.0.0' + url.pathname,
    'http://localhost:8080' + url.pathname,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: headers['authorization'] || 'Bearer 123456',
      },
      body: data,
    },
  );

  const respHeaders: HeadersInit = {};

  ret.headers.forEach((value: string, key: string) => {
    respHeaders[key] = value;
  });

  const resp: HttpResponseInit = {
    body: await ret.text(),
    cookies: undefined,
    enableContentNegotiation: undefined,
    headers: respHeaders,
    // jsonBody: await ret.json(),
    status: ret.status,
  };

  //  srv.closeIdleConnections();

  return resp;


};

//azureApp.http('httpTrigger', {
//  methods: ['GET', 'POST', 'PUT', 'DELETE'],
//  authLevel: 'function',
//  handler: httpTrigger,
//});

export default httpTrigger;

