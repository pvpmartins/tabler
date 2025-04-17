import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { GridUpdateState } from './store/sliceGridUpdate';
import {
  DataRoot,
  ICmsGetContentModelDataField,
  IListModelResponseData,
  Meta,
  OpenApiValidationFail,
} from './types';
import { useTranslation } from 'react-i18next';
import { D } from 'msw/lib/glossary-de6278a9';
import { sendHttpRequest } from './http';
import { TableDataEdgeCreateReq } from './typescript/api/resources/pontus/client/requests/TableDataEdgeCreateReq';
import { TableDataEdgeCreateRes } from './typescript/api/resources/pontus/types/TableDataEdgeCreateRes';
import {
  DeleteTableRow,
  GroupReadBody,
  NewTableRow,
  NewUser,
  DashboardReadRes,
  ReadPaginationFilter,
  UpdateTableRow,
  UpdateUser,
  User,
  DashboardRef,
  DashboardCreateReq,
  DashboardUpdateReq,
  GroupCreateReq,
  AuthGroupRef,
  GroupUpdateReq,
  GroupDeleteReq,
  DashboardsReadRes,
  DashboardAuthGroup,
  UserReadBody,
  TableRef,
  TablesReadRes,
  TableCreateRes,
  TableDeleteReq,
  TableUpdateReq,
  TableCreateReq,
  MenuDeleteReq,
  MenuUpdateReq,
  MenuUpdateRes,
  MenuReadRes,
  MenuReadReq,
  MenuCreateReq,
  MenuCreateRes,
  TableDataReadReq,
  TableDataReadRes,
  TableReadReq,
  TableReadRes,
  TableDataCreateReq,
  TableDataCreateRes,
  TableDataDeleteReq,
  DashboardGroupAuthCreateReq,
  DashboardGroupAuthCreateRes,
  DashboardGroupAuthDeleteReq,
  DashboardGroupAuthDeleteRes,
  DashboardGroupAuthReadReq,
  DashboardGroupAuthReadRes,
  DashboardGroupAuthUpdateReq,
  DashboardGroupAuthUpdateRes,
  AuthGroupsReadReq,
  AuthGroupsReadRes,
  AuthGroupDashboardCreateReq,
  AuthGroupDashboardCreateRes,
  RegisterUserReq,
  RegisterUserRes,
  AuthGroupDashboardsReadReq,
  AuthGroupDashboardsReadRes,
  AuthGroupDashboardUpdateReq,
  AuthGroupDashboardUpdateRes,
  AuthGroupDashboardDeleteReq,
  AuthGroupDashboardDeleteRes,
  AuthGroupUpdateReq,
  AuthGroupUpdateRes,
  AuthGroupDeleteReq,
  AuthGroupDeleteRes,
  LoginReq,
  LoginRes,
  RegisterAdminReq,
  RegisterAdminRes,
} from './typescript/api';
import { AuthUserGroupsCreateReq } from './typescript/api/resources/pontus/client/requests/AuthUserGroupsCreateReq';
import { AuthUserGroupsCreateRes } from './typescript/api/resources/pontus/types/AuthUserGroupsCreateRes';
import { AuthUserCreateReq } from './typescript/api/resources/pontus/client/requests/AuthUserCreateReq';
import { AuthUserCreateRes } from './typescript/api/resources/pontus/types/AuthUserCreateRes';
import { AuthUsersReadReq } from './typescript/api/resources/pontus/client/requests/AuthUsersReadReq';
import { AuthUsersReadRes } from './typescript/api/resources/pontus/types/AuthUsersReadRes';
import { AuthUserReadReq } from './typescript/api/resources/pontus/client/requests/AuthUserReadReq';
import { AuthUserReadRes } from './typescript/api/resources/pontus/types/AuthUserReadRes';
import { AuthUserUpdateReq } from './typescript/api/resources/pontus/client/requests/AuthUserUpdateReq';
import { AuthUserUpdateRes } from './typescript/api/resources/pontus/types/AuthUserUpdateRes';
import { AuthUserDeleteReq } from './typescript/api/resources/pontus/client/requests/AuthUserDeleteReq';
import { AuthUserDeleteRes } from './typescript/api/resources/pontus/types/AuthUserDeleteRes';
import { AuthUserGroupsReadReq } from './typescript/api/resources/pontus/client/requests/AuthUserGroupsReadReq';
import { AuthUserGroupsReadRes } from './typescript/api/resources/pontus/types/AuthUserGroupsReadRes';
import { AuthUserGroupsDeleteReq } from './typescript/api/resources/pontus/client/requests/AuthUserGroupsDeleteReq';
import { AuthUserGroupsDeleteRes } from './typescript/api/resources/pontus/types/AuthUserGroupsDeleteRes';
import { AuthGroupUsersCreateReq } from './typescript/api/resources/pontus/client/requests/AuthGroupUsersCreateReq';
import { AuthGroupUsersCreateRes } from './typescript/api/resources/pontus/types/AuthGroupUsersCreateRes';
import { Table } from 'semantic-ui-react';
import { AuthGroupUsersDeleteReq } from './typescript/api/resources/pontus/client/requests/AuthGroupUsersDeleteReq';
import { AuthGroupUsersReadReq } from './typescript/api/resources/pontus/client/requests/AuthGroupUsersReadReq';
import { AuthGroupUsersDeleteRes } from './typescript/api/resources/pontus/types/AuthGroupUsersDeleteRes'; import { AuthGroupUsersReadRes } from './typescript/api/resources/pontus/types/AuthGroupUsersReadRes';
import { } from './typescript/serialization';

export const getModelData = async (
  modelId: string,
  limit: number,
  after: string | null,
  fieldsSearches = null,
  sorting?: string,
): Promise<
  | {
    columnNames: ICmsGetContentModelDataField[];
    modelContentListData: IListModelResponseData[];
    meta: Meta;
  }
  | undefined
> => {
  const cmsContentModel = await cmsGetContentModel(modelId);
  const { fields: columnNames } = cmsContentModel.data;
  const data = await listModel(
    modelId,
    columnNames,
    limit,
    after,
    fieldsSearches,
    sorting,
  );
  if (!data) return;
  const { data: modelContentListData, meta } = data;

  return { columnNames, modelContentListData, meta };
};

const api = axios.create({
  baseURL: (import.meta.env['VITE_BACKEND_URL'] || 'http://172.18.0.5:8080') + '/PontusTest/1.0.0',
  // baseURL: 'http://node-app:8080' + '/PontusTest/1.0.0',
  headers: {
    Authorization: 'Bearer 123456',
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});


// wrapper for every post request. eg. handling errors like Too Many Requests (429), internal server error (500), 503...
const post = async (url: string, data?: any) => {
  const accessToken = localStorage.getItem('accessToken') || '';
  const refreshToken = localStorage.getItem('refreshToken') || '';
  const baseURL = (import.meta.env['VITE_BACKEND_URL'] || 'http://172.18.0.5:8080') + '/PontusTest/1.0.0';
  // const baseURL = 'http://node-app:8080' + '/PontusTest/1.0.0';
  const headers = {
    Authorization: `${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
  console.log({ url })


  const res = await api.post(baseURL + url, data, { headers })

  // const res = await sendHttpRequest(baseURL + url, headers, '', data, 'POST');

  return res;
};

export const loginUser = async (
  body: LoginReq,
): Promise<AxiosResponse<LoginRes>> => {
  return post('/login', body);
};
export const registerAdmin = async (
  body: RegisterAdminReq,
): Promise<AxiosResponse<RegisterAdminRes>> => {
  return post('/register/admin', body);
};

export const createMenu = async (
  body: MenuCreateReq,
): Promise<AxiosResponse<MenuCreateRes> | undefined> => {
  return post('/menu/create', body);
};

export const readMenu = async (
  body: MenuReadReq,
): Promise<AxiosResponse<MenuReadRes> | undefined> => {
  return post('/menu/read', body);
};

export const updateMenu = async (
  body: MenuUpdateReq,
): Promise<AxiosResponse<MenuUpdateRes> | undefined> => {
  return post('/menu/update', body);
};

export const deleteMenu = async (
  body: MenuDeleteReq,
): Promise<AxiosResponse<string> | undefined> => {
  return post('/menu/delete', body);
};

export const getTables = async (
  body: ReadPaginationFilter,
): Promise<AxiosResponse<TablesReadRes> | undefined> => {
  return post('/tables/read', body);
};

export const tableRead = async (
  body: TableReadReq,
): Promise<AxiosResponse<TableReadRes> | undefined> => {
  return post('/table/read', body);
};

export const createTable = async (
  data: TableCreateReq,
): Promise<AxiosResponse<TableCreateRes, any>> => {
  return post('/table/create', data);
};

export const updateTable = async (
  body: TableUpdateReq,
): Promise<AxiosResponse<string, any> | undefined> => {
  return post('/table/update', body);
};

export const deleteTable = async (
  data: TableDeleteReq,
): Promise<AxiosResponse<string, any> | undefined> => {
  return post('/table/delete', data);
};

export const tableDataCreate = async (
  body: TableDataCreateReq,
): Promise<AxiosResponse<TableDataCreateRes> | undefined> => {
  return post('/table/data/create', body);
};

export const tableDataEdgeCreate = async (
  body: TableDataEdgeCreateReq,
): Promise<AxiosResponse<TableDataEdgeCreateRes> | undefined> => {
  return post('/table/data/edge/create', body);
};

export const tableDataRead = async (
  body: TableDataReadReq,
): Promise<AxiosResponse<TableDataReadRes> | undefined> => {
  return post('/table/data/read', body);
};

export const updateDataTableRow = async (body: UpdateTableRow) => {
  return post('/table/data/update');
};

export const tableDataDelete = async (
  body: TableDataDeleteReq,
): Promise<AxiosResponse<string> | undefined> => {
  return post('/table/data/delete', body);
};

export const getAllDashboards = async (
  body: ReadPaginationFilter,
): Promise<AxiosResponse<DashboardsReadRes> | undefined> => {
  return post('/dashboards/read', body);
};

export const createDashboard = async (
  body: DashboardCreateReq,
): Promise<AxiosResponse<DashboardRef> | undefined> => {
  return post('/dashboard/create', body);
};

export const readDashboard = async (
  dashboardId: string,
): Promise<AxiosResponse<DashboardRef> | undefined> => {
  return post('/dashboard/read', { id: dashboardId });
};

export const updateDashboard = async (
  body: DashboardUpdateReq,
): Promise<AxiosResponse<string> | undefined> => {
  return post('/dashboard/update', { ...body });
};

export const deleteDashboard = async (
  dashboardId: string,
): Promise<AxiosResponse<string> | undefined> => {
  return post('/dashboard/delete', { id: dashboardId });
};

export const createAuthGroup = async (
  body: GroupCreateReq,
): Promise<AxiosResponse<AuthGroupRef> | undefined> => {
  return post('/auth/group/create', body);
};

export const readAuthGroups = async (
  data: AuthGroupsReadReq,
): Promise<AxiosResponse<AuthGroupsReadRes> | undefined> => {
  return post('/auth/groups/read', data);
};

export const updateAuthGroups = async (
  data: AuthGroupUpdateReq,
): Promise<AxiosResponse<AuthGroupUpdateRes>> => {
  return post('/auth/group/update', data);
};

export const readAuthGroup = async (
  body: GroupReadBody,
): Promise<AxiosResponse<AuthGroupRef> | undefined> => {
  return post('/auth/group/read', body);
};

export const createAuthGroupDashboards = async (
  body: AuthGroupDashboardCreateReq,
): Promise<AxiosResponse<AuthGroupDashboardCreateRes>> => {
  return post('/auth/group/dashboard/create', body);
};

export const readAuthGroupsDashboards = async (
  body: AuthGroupDashboardsReadReq,
): Promise<AxiosResponse<AuthGroupDashboardsReadRes>> => {
  return post('/auth/group/dashboards/read', body);
};

export const updateAuthGroupDashboards = async (
  body: AuthGroupDashboardUpdateReq,
): Promise<AxiosResponse<AuthGroupDashboardUpdateRes>> => {
  return post('/auth/group/dashboard/update', body);
};

export const deleteAuthGroupDashboards = async (
  body: AuthGroupDashboardDeleteReq,
): Promise<AxiosResponse<AuthGroupDashboardDeleteRes>> => {
  return post('/auth/group/dashboard/delete', body);
};

export const createAuthGroupUsers = async (
  body: AuthGroupUsersCreateReq,
): Promise<AxiosResponse<AuthGroupUsersCreateRes>> => {
  return post('/auth/group/users/create', body);
};

export const readAuthGroupsUsers = async (
  body: AuthGroupUsersReadReq,
): Promise<AxiosResponse<AuthGroupUsersReadRes>> => {
  return post('/auth/group/users/read', body);
};

export const deleteAuthGroupUsers = async (
  body: AuthGroupUsersDeleteReq,
): Promise<AxiosResponse<AuthGroupUsersDeleteRes>> => {
  return post('/auth/group/users/delete', body);
};

export const updateAuthGroup = async (
  body: GroupUpdateReq,
): Promise<AxiosResponse<Response> | undefined> => {
  return post('/auth/group/update', body);
};

export const deleteAuthGroup = async (
  body: AuthGroupDeleteReq,
): Promise<AxiosResponse<AuthGroupDeleteRes>> => {
  return post('/auth/group/delete', body);
};

export const createUser = async (
  body: AuthUserCreateReq,
): Promise<AxiosResponse<AuthUserCreateRes> | undefined> => {
  return post('/auth/user/create', body);
};

export const readUsers = async (
  body: AuthUsersReadReq,
): Promise<AxiosResponse<AuthUsersReadRes> | undefined> => {
  return post('/auth/users/read', body);
};

export const readUser = async (
  body: AuthUserReadReq,
): Promise<AxiosResponse<AuthUserReadRes> | undefined> => {
  return post('/auth/user/read', body);
};

export const updateUser = async (
  body: AuthUserUpdateReq,
): Promise<AxiosResponse<AuthUserUpdateRes>> => {
  return post('/auth/user/update', body);
};

export const deleteUser = async (
  data: AuthUserDeleteReq,
): Promise<AxiosResponse<AuthUserDeleteRes> | undefined> => {
  return post('/auth/user/delete', data);
};

export const createUserGroups = async (
  body: AuthUserGroupsCreateReq,
): Promise<AxiosResponse<AuthUserGroupsCreateRes> | undefined> => {
  return post('/auth/user/groups/create', body);
};

export const readUserGroups = async (
  body: AuthUserGroupsReadReq,
): Promise<AxiosResponse<AuthUserGroupsReadRes> | undefined> => {
  return post('/auth/user/groups/read', body);
};

export const deleteUserGroups = async (
  body: AuthUserGroupsDeleteReq,
): Promise<AxiosResponse<AuthUserGroupsDeleteRes>> => {
  return post('/auth/user/groups/delete', body);
};

export const createDashboardGroupAuth = async (
  data: DashboardGroupAuthCreateReq,
): Promise<AxiosResponse<DashboardGroupAuthCreateRes> | undefined> => {
  return post('/dashboard/group/auth/create', data);
};

export const readDashboardGroupAuth = async (
  data: DashboardGroupAuthReadReq,
): Promise<AxiosResponse<DashboardGroupAuthReadRes> | undefined> => {
  return post('/dashboard/group/auth/read', data);
};

export const updateDashboardGroupAuth = async (
  data: DashboardGroupAuthUpdateReq,
): Promise<AxiosResponse<DashboardGroupAuthUpdateRes> | undefined> => {
  return post('/dashboard/group/auth/update', data);
};

export const deleteDashboardGroupAuth = async (
  data: DashboardGroupAuthDeleteReq,
): Promise<AxiosResponse<DashboardGroupAuthDeleteRes> | undefined> => {
  return post('/dashboard/group/auth/delete', data);
};

export const registerUser = async (
  data: RegisterUserReq,
): Promise<RegisterUserRes> => {
  return post('/register/user', data);
};

// export const getApiKeys = async () => {
//   const data = await listApiKeys();

//   return data;
// };

export const getModelFields = async (
  tableId: string,
): Promise<AxiosResponse<Table> | undefined> => {
  return post('/table/read', { tableId });
};

export const deleteEntry = async (modelId: string, entryId: string) => {
  try {
    const { data } = await cmsDeleteEntry(modelId, entryId);

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const postNewEntry = async (
  dataInput: {
    [key: string]: unknown;
  },
  fields: ICmsGetContentModelDataField[],
  modelId: string,
) => {
  const fieldsKeysStr = createMutationStr(fields);

  try {
    const { data } = await cmsEntriesCreateModel(
      modelId,
      dataInput,
      fieldsKeysStr,
    );

    if (data.id) {
      const { data: publishedData } = await cmsPublishModelId(modelId, data.id);
      return publishedData;
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateEntry = async (
  dataInput: {
    [key: string]: unknown;
  },
  fields: ICmsGetContentModelDataField[],
  modelId: string,
  rowId: string,
) => {
  const fieldsKeysStr = createMutationStr(fields);

  const { data } = await cmsCreateModelFrom(
    modelId,
    dataInput,
    fieldsKeysStr,
    rowId,
  );

  if (data.id) {
    const { data: publishedData } = await cmsPublishModelId(modelId, data.id);

    return publishedData;
  }
};

const createMutationStr = (fields: ICmsGetContentModelDataField[]): string => {
  let str = '';

  fields.forEach((field) => {
    if (field.type === 'text' || field.type === 'long-text') {
      str += `${field.fieldId}\n`;
    } else if (field.type === 'ref') {
      str += `${field.fieldId} {
      modelId
      id
      __typename
    }\n`;
    } else if (field.type === 'object' && field?.settings) {
      const objFields = field.settings.fields;

      if (!objFields) return;
      str += `${field.fieldId} {
        ${createMutationStr(objFields)}
      }\n`;
    }
  });

  return str;
};
