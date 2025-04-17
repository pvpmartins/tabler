import {
  DashboardCreateReq,
  DashboardCreateRes,
  DashboardGroupAuthReadRes,
  DashboardGroupAuthReadReq,
  DashboardGroupAuthUpdateRes,
  DashboardGroupAuthDeleteRes,
  AuthGroupCreateReq,
  AuthGroupUpdateReq,
  AuthGroupCreateRes,
  AuthGroupReadRes,
  AuthGroupReadReq,
  AuthGroupDeleteReq,
  AuthGroupDeleteRes,
  AuthGroupsReadReq,
  AuthGroupsReadRes,
  AuthGroupDashboardCreateReq,
  AuthGroupDashboardCreateRes,
  AuthGroupDashboardUpdateReq,
  AuthGroupDashboardDeleteReq,
  AuthGroupDashboardsReadReq,
  AuthGroupDashboardsReadRes,
  AuthGroupDashboardUpdateRes,
  AuthGroupUsersCreateReq,
  AuthGroupUsersCreateRes,
  AuthGroupUsersReadReq,
  AuthGroupUsersReadRes,
  AuthGroupUsersDeleteReq,
  TableCreateReq,
  TableCreateRes,
  AuthGroupTablesCreateRes,
  AuthGroupTablesCreateReq,
  AuthGroupTablesReadReq,
  AuthGroupTablesReadRes,
  AuthGroupTablesDeleteReq,
  AuthGroupTablesDeleteRes,
  AuthGroupDashboardDeleteRes,
  AuthGroupUpdateRes,
} from '../typescript/api';
// import { sendHttpRequest } from '../http';
// import { method } from 'lodash';
// import axios from 'axios';
import { srv } from '../server';

import { prepareDbAndAuth } from './test-utils';
import { AxiosResponse } from 'axios';
import { AUTH_GROUPS, AUTH_USERS, DASHBOARDS, TABLES, DELTA_DB, GROUPS_DASHBOARDS, GROUPS_USERS } from '../consts';
import { runQuery } from '../db-utils';

// // Mock the utils.writeJson function
// jest.mock('../utils/writer', () => ({
//   writeJson: jest.fn(),
// }));

// // Mock the Default service functions
// jest.mock('../service/DefaultService', () => ({
//   dashboardUpdatePOST: jest.fn(),
//   dashboardsReadPOST: jest.fn(),
// }));
jest.setTimeout(1000000);

describe('dashboardCreatePOST', () => {
  const OLD_ENV = process.env;

  let postAdmin;
  let admin;
  let tables = [AUTH_GROUPS, AUTH_USERS, DASHBOARDS, TABLES];
  if (process.env.DB_SOURCE === DELTA_DB) {
    tables = [...tables, GROUPS_DASHBOARDS, GROUPS_USERS];
  }
  beforeEach(async () => {
    const dbUtils = await prepareDbAndAuth(tables);
    postAdmin = dbUtils.postAdmin;
    admin = dbUtils.admin;
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(async () => {
    for (const table of tables) {
      runQuery(`DELETE FROM ${table};`)
    }
    process.env = OLD_ENV; // Restore old environment
    srv.closeAllConnections()
    srv.close();
  });

  it.only('should create a group', async () => {
    const createBody: AuthGroupCreateReq = {
      name: 'group1',
    };

    const authGroupCreateRes = (await postAdmin(
      '/auth/group/create',
      createBody,
    )) as AxiosResponse<AuthGroupCreateRes>;
    expect(authGroupCreateRes.status).toBe(200);

    expect(authGroupCreateRes.data).toMatchObject(createBody);

    const readBody: AuthGroupReadReq = {
      id: authGroupCreateRes.data.id,
      name: authGroupCreateRes.data.name,
    };

    const authGroupReadRes = (await postAdmin(
      '/auth/group/read',
      readBody,
    )) as AxiosResponse<AuthGroupReadRes>;

    expect(authGroupReadRes.status).toBe(200);

    // expect(authGroupReadRes.data).toMatchObject(authGroupCreateRes.data);

    const deleteBody: AuthGroupDeleteReq = {
      id: authGroupCreateRes.data.id,

      name: authGroupCreateRes.data.name,
    };

    const authGroupDeleteRes = (await postAdmin(
      '/auth/group/delete',
      deleteBody,
    )) as AxiosResponse<AuthGroupDeleteRes>;

    expect(authGroupDeleteRes.status).toBe(200);
  });
  it('should read many groups', async () => {
    const createBody: AuthGroupCreateReq = {
      name: 'group1',
    };

    const authGroupCreateRes = (await postAdmin(
      'auth/group/create',
      createBody,
    )) as AxiosResponse<AuthGroupCreateRes>;

    const createBody2: AuthGroupCreateReq = {
      name: 'group2',
    };

    const authGroupCreateRes2 = (await postAdmin(
      'auth/group/create',
      createBody2,
    )) as AxiosResponse<AuthGroupCreateRes>;
    expect(authGroupCreateRes.status).toBe(200);

    expect(authGroupCreateRes.data).toMatchObject(createBody);

    const readGroupsBody: AuthGroupsReadReq = {
      from: 1,
      to: 20,
      filters: {
        name: {
          condition1: {
            filter: 'group1',
            filterType: 'text',
            type: 'contains',
          },
          operator: 'OR',
          filterType: 'text',
          condition2: {
            filter: 'group2',
            filterType: 'text',
            type: 'contains',
          },
        },
      },
    };

    const readGroups = (await postAdmin(
      'auth/groups/read',
      readGroupsBody,
    )) as AxiosResponse<AuthGroupsReadRes>;

    expect(
      readGroups.data.authGroups.some(
        (el) => el.id === authGroupCreateRes.data.id,
      ),
    ).toBeTruthy();

    expect(
      readGroups.data.authGroups.some(
        (el) => el.id === authGroupCreateRes2.data.id,
      ),
    ).toBeTruthy();
  });
  it('should do the sad path', async () => {
    const readBody: AuthGroupReadReq = {
      id: 'foo',

      name: 'bar',
    };

    const authGroupReadRes = (await postAdmin(
      'auth/group/read',
      readBody,
    )) as AxiosResponse<AuthGroupReadRes>;
    expect(authGroupReadRes.status).toBe(404);

    const authGroupDeleteRes = (await postAdmin(
      '/auth/group/delete',
      readBody,
    )) as AxiosResponse<AuthGroupCreateRes>;

    expect(authGroupDeleteRes.status).toBe(404);

    const createBody: AuthGroupCreateReq = {
      name: 'group1',
    };

    const authGroupCreateRes = (await postAdmin(
      '/auth/group/create',
      createBody,
    )) as AxiosResponse<AuthGroupCreateRes>;
    expect(authGroupCreateRes.status).toBe(200);

    const authGroupCreateRes2 = (await postAdmin('/auth/group/create', {
      id: authGroupCreateRes.data.id,
      ...createBody,
    })) as AxiosResponse<AuthGroupCreateRes>;
    expect(authGroupCreateRes2.status).toBe(409);

    const readGroupsBody: AuthGroupsReadReq = {
      from: 1,
      to: 20,
      filters: {
        name: {
          condition1: {
            filter: 'foo',
            filterType: 'text',
            type: 'contains',
          },
          operator: 'AND',
          filterType: 'text',
          condition2: {
            filter: 'bar',
            filterType: 'text',
            type: 'contains',
          },
        },
      },
    };

    const readGroups = (await postAdmin(
      'auth/groups/read',
      readGroupsBody,
    )) as AxiosResponse<AuthGroupsReadRes>;

    expect(readGroups.status).toBe(404);

    const updateBody: AuthGroupDashboardUpdateReq = {
      dashboards: [
        {
          create: true,
          delete: true,
          read: true,
          update: true,
          id: 'foo',
          name: 'f',
        },
      ],
      id: 'foo',
      name: authGroupCreateRes.data.name,
    };

    const updateRetVal = (await postAdmin(
      'auth/group/dashboard/update',
      updateBody,
    )) as AxiosResponse<DashboardGroupAuthUpdateRes>;

    expect(updateRetVal.status).toBe(404);

    const deleteBody: AuthGroupDashboardDeleteReq = {
      dashboardIds: [],
      id: 'foo',
      name: 'bar',
    };
    const deleteRetVal = (await postAdmin(
      'auth/group/dashboard/delete',
      deleteBody,
    )) as AxiosResponse<DashboardGroupAuthDeleteRes>;

    expect(deleteRetVal.status).toBe(400);

    const deleteBody2: AuthGroupDashboardDeleteReq = {
      dashboardIds: ['foo', 'bar'],
      name: authGroupCreateRes.data.name,

      id: authGroupCreateRes.data.id,
    };

    const delete2RetVal = (await postAdmin(
      'auth/group/dashboard/delete',
      deleteBody2,
    )) as AxiosResponse<AuthGroupDashboardDeleteRes>;
    expect(delete2RetVal.status).toBe(404);
  });
  it('should create dashboards subdocuments', async () => {
    const body: DashboardCreateReq = {
      owner: 'Joe',
      name: 'PontusVision',
      folder: 'folder 1',
      state: {},
    };

    const createRetVal = (await postAdmin(
      'dashboard/create',
      body,
    )) as AxiosResponse<DashboardCreateRes>;

    const createGroupBody: AuthGroupCreateReq = {
      name: 'group1',
    };

    const authGroupCreateRes = (await postAdmin(
      'auth/group/create',
      createGroupBody,
    )) as AxiosResponse<AuthGroupCreateRes>;

    const authGroupId = authGroupCreateRes.data.id;

    const createBody: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: createRetVal.data.name,
          id: createRetVal.data.id,
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      id: authGroupId,
      name: authGroupCreateRes.data.name,
    };

    const groupDashCreateRes = (await postAdmin(
      'auth/group/dashboard/create',
      createBody,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    expect(groupDashCreateRes.status).toBe(200);

    expect(groupDashCreateRes.data.dashboards).toMatchObject(
      createBody.dashboards,
    );

    expect(groupDashCreateRes.data.dashboards).toMatchObject(
      createBody.dashboards,
    );

    const readBody: DashboardGroupAuthReadReq = {
      id: createRetVal.data.id,
      filters: {
        // name: {
        //   condition1: {
        //     filter: 'group1',
        //     filterType: 'text',
        //     type: 'contains',
        //   },
        //   filterType: 'text',
        // },
      },
    };

    const readRetVal = (await postAdmin(
      'dashboard/group/auth/read',
      readBody,
    )) as AxiosResponse<DashboardGroupAuthReadRes>;

    expect(readRetVal.data.authGroups[0]).toMatchObject({
      name: authGroupCreateRes.data.name,
      id: authGroupCreateRes.data.id,
      create: false,
      delete: true,
      read: false,
      update: true,
    });
  });
  it('should update dashboards subdocuments', async () => {
    const body: DashboardCreateReq = {
      owner: 'Joe',
      name: 'PontusVision',
      folder: 'folder 1',
      state: {},
    };

    const createRetVal = (await postAdmin(
      'dashboard/create',
      body,
    )) as AxiosResponse<DashboardCreateRes>;

    const authGroupCreateRes = (await postAdmin('auth/group/create', {
      name: 'group1',
    })) as AxiosResponse<AuthGroupCreateRes>;

    const authGroupId = authGroupCreateRes.data.id;

    const createBody: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: createRetVal.data.name,
          id: createRetVal.data.id,
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      id: authGroupId,
      name: authGroupCreateRes.data.name,
    };
    const groupDashCreateRes = (await postAdmin(
      'auth/group/dashboard/create',
      createBody,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    expect(groupDashCreateRes.status).toBe(200);

    const updateBody: AuthGroupDashboardUpdateReq = {
      id: authGroupId,
      name: authGroupCreateRes.data.name,
      dashboards: [
        {
          name: createRetVal.data.name,
          id: createRetVal.data.id,
          create: true,
          delete: true,
          read: true,
          update: true,
        },
      ],
    };

    const groupDashUpdateRes = (await postAdmin(
      'auth/group/dashboard/update',
      updateBody,
    )) as AxiosResponse<AuthGroupDashboardUpdateRes>;

    expect(groupDashUpdateRes.status).toBe(200);

    expect(groupDashUpdateRes.data.dashboards).toMatchObject(
      updateBody.dashboards,
    );

    const readBody: DashboardGroupAuthReadReq = {
      id: createRetVal.data.id,
      from: 1,
      to: 20,
      filters: {
        // name: {
        //   // condition1: {
        //   filter: 'Pontus',
        //   filterType: 'text',
        //   type: 'contains',
        //   // },
        //   // filterType: 'text',
        // },
      },
    };

    const readRetVal2 = (await postAdmin(
      'dashboard/group/auth/read',
      readBody,
    )) as AxiosResponse<DashboardGroupAuthReadRes>;

    expect(readRetVal2.data?.authGroups[0]).toMatchObject({
      name: authGroupCreateRes.data.name,
      id: authGroupCreateRes.data.id,
      create: true,
      delete: true,
      read: true,
      update: true,
    });

    const readBody2: AuthGroupDashboardsReadReq = {
      id: authGroupId,
      name: authGroupCreateRes.data.name,

      filters: {
        name: {
          condition1: {
            filter: createRetVal.data.name,
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal3 = (await postAdmin(
      '/auth/group/dashboards/read',
      readBody2,
    )) as AxiosResponse<AuthGroupDashboardsReadRes>;

    expect(readRetVal3.data.dashboards).toMatchObject(
      groupDashUpdateRes.data.dashboards,
    );
  });
  it('should update a authGroup and its reference in a dashboard', async () => {
    const body: DashboardCreateReq = {
      owner: 'Joe',
      name: 'PontusVision',
      folder: 'folder 1',
      state: {},
    };

    const createRetVal = (await postAdmin(
      'dashboard/create',
      body,
    )) as AxiosResponse<DashboardCreateRes>;

    const authGroupCreateRes = (await postAdmin('auth/group/create', {
      name: 'group1',
    })) as AxiosResponse<AuthGroupCreateRes>;

    const createBody: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: createRetVal.data.name,
          id: createRetVal.data.id,
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      id: authGroupCreateRes.data.id,
      name: authGroupCreateRes.data.name,
    };
    const groupDashCreateRes = (await postAdmin(
      'auth/group/dashboard/create',
      createBody,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    expect(groupDashCreateRes.status).toBe(200);

    const readBody: AuthGroupReadReq = {
      id: authGroupCreateRes.data.id,
      name: authGroupCreateRes.data.name,
    };

    const authGroupReadRes = (await postAdmin(
      '/auth/group/read',
      readBody,
    )) as AxiosResponse<AuthGroupReadRes>;

    expect(authGroupReadRes.data.name).toBe(authGroupCreateRes.data.name);
  });
  it('should delete dashboards subdocuments', async () => {
    const body: DashboardCreateReq = {
      owner: 'Joe',
      name: 'PontusVision',
      folder: 'folder 1',
      state: {},
    };

    const createRetVal = (await postAdmin(
      'dashboard/create',
      body,
    )) as AxiosResponse<DashboardCreateRes>;

    const authGroupCreateRes = (await postAdmin('auth/group/create', {
      name: 'group1',
    })) as AxiosResponse<AuthGroupCreateRes>;

    const authGroupId = authGroupCreateRes.data.id;

    const createBody: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: createRetVal.data.name,
          id: createRetVal.data.id,
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      name: authGroupCreateRes.data.name,
      id: authGroupId,
    };

    const groupDashCreateRes = (await postAdmin(
      'auth/group/dashboard/create',
      createBody,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    // expect(groupDashCreateRes.data.dashboards).toMatchObject(
    //   createBody.dashboards,
    // );

    // expect(groupDashCreateRes.data.dashboards).toMatchObject(
    //   createBody.dashboards,
    // );

    const readBody4: AuthGroupDashboardsReadReq = {
      id: authGroupCreateRes.data.id,
      name: authGroupCreateRes.data.name,
      filters: {
        name: {
          condition1: {
            filter: createRetVal.data.name,
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal4 = (await postAdmin(
      '/auth/group/dashboards/read',
      readBody4,
    )) as AxiosResponse<AuthGroupDashboardsReadRes>;

    const readBody5: DashboardGroupAuthReadReq = {
      id: createRetVal.data.id,
      from: 1,
      to: 10,
      filters: {
        name: {
          condition1: {
            filter: 'group1',
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal5 = (await postAdmin(
      'dashboard/group/auth/read',
      readBody5,
    )) as AxiosResponse<DashboardGroupAuthReadRes>;

    expect(readRetVal4.data.dashboards[0]).toMatchObject(
      createBody.dashboards[0],
    );
    expect(readRetVal5.data.authGroups[0]).toMatchObject({
      name: authGroupCreateRes.data.name,
      id: authGroupCreateRes.data.id,
      create: false,
      delete: true,
      read: false,
      update: true,
    });

    const deleteBody: AuthGroupDashboardDeleteReq = {
      dashboardIds: [createRetVal.data.id],
      id: authGroupId,
      name: authGroupCreateRes.data.name,
    };

    const readRetVal = (await postAdmin(
      'auth/group/dashboard/delete',
      deleteBody,
    )) as AxiosResponse<DashboardGroupAuthDeleteRes>;

    expect(readRetVal.status).toBe(200);

    const readBody: DashboardGroupAuthReadReq = {
      id: createRetVal.data.id,
      filters: {
        name: {
          condition1: {
            filter: 'group1',
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal2 = (await postAdmin(
      'dashboard/group/auth/read',
      readBody,
    )) as AxiosResponse<DashboardGroupAuthReadRes>;

    const readBody2: AuthGroupDashboardsReadReq = {
      id: authGroupId,
      name: authGroupCreateRes.data.name,
      filters: {
        name: {
          condition1: {
            filter: createRetVal.data.name,
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal3 = (await postAdmin(
      '/auth/group/dashboards/read',
      readBody2,
    )) as AxiosResponse<DashboardGroupAuthReadRes>;

    expect(readRetVal2.status).toBe(404);
    expect(readRetVal3.status).toBe(404);
  });
  it('should create a an authgroup, associate a dashboard and delete it, and its reference in the dashboard', async () => {
    const body: DashboardCreateReq = {
      owner: 'Joe',
      name: 'PontusVision',
      folder: 'folder 1',
      state: {},
    };

    const createRetVal = (await postAdmin(
      'dashboard/create',
      body,
    )) as AxiosResponse<DashboardCreateRes>;

    const authGroupCreateRes = (await postAdmin('auth/group/create', {
      name: 'group1',
    })) as AxiosResponse<AuthGroupCreateRes>;

    const authGroupId = authGroupCreateRes.data.id;

    const createBody: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: createRetVal.data.name,
          id: createRetVal.data.id,
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      name: authGroupCreateRes.data.name,
      id: authGroupId,
    };

    const groupDashCreateRes = (await postAdmin(
      'auth/group/dashboard/create',
      createBody,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    const readBody: DashboardGroupAuthReadReq = {
      id: createRetVal.data.id,
      filters: {
        name: {
          condition1: {
            filter: 'group1',
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal = (await postAdmin(
      'dashboard/group/auth/read',
      readBody,
    )) as AxiosResponse<DashboardGroupAuthReadRes>;

    expect(readRetVal.data.authGroups[0].name).toBe(
      authGroupCreateRes.data.name,
    );

    const deleteBody: AuthGroupDeleteReq = {
      id: authGroupCreateRes.data.id,
      name: authGroupCreateRes.data.name,
    };

    const authGroupDeleteRes = (await postAdmin(
      '/auth/group/delete',
      deleteBody,
    )) as AxiosResponse<AuthGroupDeleteRes>;

    expect(authGroupDeleteRes.status).toBe(200);

    const readRetVal2 = (await postAdmin(
      'dashboard/group/auth/read',
      readBody,
    )) as AxiosResponse<DashboardGroupAuthReadRes>;

    expect(readRetVal2.status).toBe(404);
  });
  it('should UPDATE dashboards subdocuments incorreclty', async () => {
    const body: DashboardCreateReq = {
      owner: 'Joe',
      name: 'PontusVision',
      folder: 'folder 1',
      state: {},
    };

    const createRetVal = (await postAdmin(
      'dashboard/create',
      body,
    )) as AxiosResponse<DashboardCreateRes>;

    const authGroupCreateRes = (await postAdmin('auth/group/create', {
      name: 'group1',
    })) as AxiosResponse<AuthGroupCreateRes>;

    const authGroupId = authGroupCreateRes.data.id;

    const deleteBody: AuthGroupDashboardUpdateReq = {
      dashboards: [
        {
          id: 'foo',
          create: true,
          read: true,
          update: true,
          delete: true,
          name: 'bar',
        },
      ],
      name: authGroupCreateRes.data.name,
      id: authGroupId,
    };

    const readRetVal = (await postAdmin(
      'auth/group/dashboard/update',
      deleteBody,
    )) as AxiosResponse<DashboardGroupAuthDeleteRes>;

    // Should say it does not have edges
    expect(readRetVal.status).toBe(404);
  });
  it('should associate a dashboard to an incorrect authGroup', async () => {
    const createDashBody: DashboardCreateReq = {
      name: 'dashboard1',
      owner: 'foo',
    };

    const createDashRetVal = (await postAdmin(
      'dashboard/create',
      createDashBody,
    )) as AxiosResponse<DashboardCreateRes>;

    expect(createDashRetVal.status).toBe(200);
    const createGroupBody: AuthGroupCreateReq = {
      name: 'group1',
    };

    const authGroupCreateRes = (await postAdmin(
      'auth/group/create',
      createGroupBody,
    )) as AxiosResponse<AuthGroupCreateRes>;

    expect(authGroupCreateRes.status).toBe(200);

    const createBody2: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: 'foo',
          id: 'bar',
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      name: authGroupCreateRes.data.name,
      id: authGroupCreateRes.data.id,
    };

    const groupDashCreateRes2 = (await postAdmin(
      'auth/group/dashboard/create',
      createBody2,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    expect(groupDashCreateRes2.status).toBe(404);
    const createBody: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: 'foo',
          id: 'bar',
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      name: 'foo',
      id: 'bar',
    };

    const groupDashCreateRes = (await postAdmin(
      'auth/group/dashboard/create',
      createBody,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    expect(groupDashCreateRes.status).toBe(404);

    const createBody3: AuthGroupDashboardCreateReq = {
      dashboards: [
        {
          name: createDashRetVal.data.name,
          id: createDashRetVal.data.id,
          create: false,
          delete: true,
          read: false,
          update: true,
        },
      ],
      name: 'foo',
      id: 'bar',
    };

    const groupDashCreateRes3 = (await postAdmin(
      'auth/group/dashboard/create',
      createBody3,
    )) as AxiosResponse<AuthGroupDashboardCreateRes>;

    expect(groupDashCreateRes3.status).toBe(404);
  });
  it('should create a an authgroup, associate an authuser and delete it, and its reference in the dashboard', async () => {
    const body: AuthGroupCreateReq = {
      name: 'group1',
    };

    const createRetVal = (await postAdmin(
      'auth/group/create',
      body,
    )) as AxiosResponse<AuthGroupCreateRes>;

    expect(createRetVal.status).toBe(200);

    const createBody: AuthGroupUsersCreateReq = {
      authUsers: [
        {
          id: admin.id,
          username: admin.username,
        },
      ],
      id: createRetVal.data.id,
      name: createRetVal.data.name,
    };

    const groupUserCreateRes = (await postAdmin(
      'auth/group/users/create',
      createBody,
    )) as AxiosResponse<AuthGroupUsersCreateRes>;

    expect(groupUserCreateRes.status).toBe(200);

    const readBody: AuthGroupUsersReadReq = {
      id: createRetVal.data.id,
      filters: {
        // username: {
        //   condition1: {
        //     filter: 'user1',
        //     filterType: 'text',
        //     type: 'contains',
        //   },
        //   filterType: 'text',
        // },
      },
    };

    const readRetVal = (await postAdmin(
      'auth/group/users/read',
      readBody,
    )) as AxiosResponse<AuthGroupUsersReadRes>;

    expect(readRetVal.data.authUsers[0].username).toBe(admin.username);

    const deleteBody: AuthGroupDeleteReq = {
      id: createRetVal.data.id,
      name: createRetVal.data.name,
    };

    const authGroupDeleteRes = (await postAdmin(
      '/auth/group/delete',
      deleteBody,
    )) as AxiosResponse<AuthGroupDeleteRes>;

    expect(authGroupDeleteRes.status).toBe(200);

    const readRetVal2 = (await postAdmin(
      'auth/group/users/read',
      readBody,
    )) as AxiosResponse<AuthGroupUsersReadRes>;

    expect(readRetVal2.status).toBe(404);
  });
  it('should update a authGroup and its reference in a authUser', async () => {
    const body: AuthGroupCreateReq = {
      name: 'group1',
    };

    const createRetVal = (await postAdmin(
      'auth/group/create',
      body,
    )) as AxiosResponse<AuthGroupCreateRes>;

    const createBody: AuthGroupUsersCreateReq = {
      authUsers: [
        {
          id: admin.id,
          username: admin.username,
        },
      ],
      id: createRetVal.data.id,
      name: createRetVal.data.name,
    };

    const groupUserCreateRes = (await postAdmin(
      'auth/group/users/create',
      createBody,
    )) as AxiosResponse<AuthGroupUsersCreateRes>;

    expect(groupUserCreateRes.status).toBe(200);

    const readBody: AuthGroupUsersReadReq = {
      id: createRetVal.data.id,
      filters: {
        username: {
          condition1: {
            filter: admin.username,
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal = (await postAdmin(
      'auth/group/users/read',
      readBody,
    )) as AxiosResponse<AuthGroupUsersReadRes>;

    expect(readRetVal.data.authUsers[0].username).toBe(admin.username);

    const updateBody: AuthGroupUpdateReq = {
      name: createRetVal.data.name,
      id: createRetVal.data.id,
    };

    const groupUserUpdateRes = (await postAdmin(
      'auth/group/update',
      updateBody,
    )) as AxiosResponse<AuthGroupUpdateRes>;

    expect(groupUserUpdateRes.status).toBe(200);

    const deleteBody: AuthGroupDeleteReq = {
      id: createRetVal.data.id,
      name: createRetVal.data.name,
    };

    const authGroupDeleteRes = (await postAdmin(
      '/auth/group/delete',
      deleteBody,
    )) as AxiosResponse<AuthGroupDeleteRes>;

    expect(authGroupDeleteRes.status).toBe(200);

    const readRetVal2 = (await postAdmin(
      'auth/group/users/read',
      readBody,
    )) as AxiosResponse<AuthGroupUsersReadRes>;

    expect(readRetVal2.status).toBe(404);
  });
  it('should create a an authgroup, associate an authuser and delete its reference', async () => {
    const body: AuthGroupCreateReq = {
      name: 'group1',
    };

    const createRetVal = (await postAdmin(
      'auth/group/create',
      body,
    )) as AxiosResponse<AuthGroupCreateRes>;

    const createBody: AuthGroupUsersCreateReq = {
      authUsers: [
        {
          id: admin.id,
          username: admin.username,
        },
      ],
      id: createRetVal.data.id,
      name: createRetVal.data.name,
    };

    const groupUserCreateRes = (await postAdmin(
      'auth/group/users/create',
      createBody,
    )) as AxiosResponse<AuthGroupUsersCreateRes>;

    const readBody: AuthGroupUsersReadReq = {
      id: createRetVal.data.id,
      filters: {
        username: {
          condition1: {
            filter: 'user1',
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal = (await postAdmin(
      'auth/group/users/read',
      readBody,
    )) as AxiosResponse<AuthGroupUsersReadRes>;

    expect(readRetVal.data.authUsers[0].username).toBe(admin.username);

    const deleteBody2: AuthGroupUsersDeleteReq = {
      id: createRetVal.data.id,
      name: createRetVal.data.name,
      authUsers: [{ id: admin.id, username: admin.username }],
    };

    const authGroupDeleteRes = (await postAdmin(
      '/auth/group/users/delete',
      deleteBody2,
    )) as AxiosResponse<AuthGroupDeleteRes>;

    expect(authGroupDeleteRes.status).toBe(200);

    const readRetVal2 = (await postAdmin(
      'auth/group/users/read',
      readBody,
    )) as AxiosResponse<AuthGroupUsersReadRes>;

    expect(readRetVal2.status).toBe(404);
  });
  it('should create a an authgroup, associate a table and delete its reference', async () => {
    const body: AuthGroupCreateReq = {
      name: 'group1',
    };

    const createGroupRetVal = (await postAdmin(
      'auth/group/create',
      body,
    )) as AxiosResponse<AuthGroupCreateRes>;

    const tableBody: TableCreateReq = {
      name: 'person-natural',
      label: 'Person Natural',
      cols: [
        {
          field: 'Person_Natural_Full_Name',
          filter: true,
          headerName: 'Full Name',
          id: 'Person_Natural_Full_Name',
          name: 'full-name',
          sortable: true,
          pivotIndex: 1,
          kind: 'text'
        },
        {
          field: 'Person_Natural_Customer_ID',
          filter: true,
          headerName: 'Customer ID',
          id: 'Person_Natural_Customer_ID',
          name: 'customer-id',
          sortable: true,
          pivotIndex: 2,
          kind: 'text'
        },
      ],
    };

    const createTableRetVal = (await postAdmin(
      'table/create',
      tableBody,
    )) as AxiosResponse<TableCreateRes>;

    expect(createTableRetVal.status).toBe(200);

    const createGroupTablesBody: AuthGroupTablesCreateReq = {
      id: createGroupRetVal.data.id,
      name: createGroupRetVal.data.name,
      tables: [
        { id: createTableRetVal.data.id, name: createTableRetVal.data.name },
      ],
    };

    const groupTablesCreateRes = (await postAdmin(
      'auth/group/tables/create',
      createGroupTablesBody,
    )) as AxiosResponse<AuthGroupTablesCreateRes>;

    const readBody: AuthGroupTablesReadReq = {
      id: createGroupRetVal.data.id,
      name: createGroupRetVal.data.name,
      filters: {
        name: {
          condition1: {
            filter: createTableRetVal.data.name,
            filterType: 'text',
            type: 'contains',
          },
          filterType: 'text',
        },
      },
    };

    const readRetVal = (await postAdmin(
      'auth/group/tables/read',
      readBody,
    )) as AxiosResponse<AuthGroupTablesReadRes>;

    expect(readRetVal.data.tables[0].id).toBe(createTableRetVal.data.id);

    const deleteBody2: AuthGroupTablesDeleteReq = {
      id: createGroupRetVal.data.id,
      name: createGroupRetVal.data.name,
      tables: [
        { name: createTableRetVal.data.name, id: createTableRetVal.data.id },
      ],
    };

    const authGroupDeleteRes = (await postAdmin(
      '/auth/group/tables/delete',
      deleteBody2,
    )) as AxiosResponse<AuthGroupTablesDeleteRes>;

    expect(authGroupDeleteRes.status).toBe(200);

    const readRetVal2 = (await postAdmin(
      'auth/group/tables/read',
      readBody,
    )) as AxiosResponse<AuthGroupUsersReadRes>;

    expect(readRetVal2.status).toBe(404);
  });
});
