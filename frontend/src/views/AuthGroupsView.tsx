import { useEffect, useRef, useState } from 'react';
import {
  createAuthGroup,
  createAuthGroupDashboards,
  createAuthGroupUsers,
  createDashboard,
  createDashboardGroupAuth,
  deleteAuthGroupDashboards,
  deleteAuthGroupUsers,
  deleteDashboard,
  deleteDashboardGroupAuth,
  getAllDashboards,
  readAuthGroups,
  readAuthGroupsDashboards,
  readAuthGroupsUsers,
  readDashboardGroupAuth,
  updateAuthGroupDashboards,
  updateAuthGroups,
  updateDashboardGroupAuth,
} from '../client';
import {
  AuthGroupDashboardDeleteReq,
  AuthGroupDashboardRef,
  AuthGroupDashboardUpdateReq,
  AuthGroupDashboardUpdateRes,
  AuthGroupDashboardsReadReq,
  AuthGroupDashboardsReadRes,
  AuthGroupReadRes,
  AuthGroupRef,
  AuthGroupUpdateReq,
  AuthGroupUpdateRes,
  AuthGroupUsersCreateReq,
  AuthGroupUsersCreateRes,
  AuthGroupUsersDeleteReq,
  AuthGroupUsersReadReq,
  AuthGroupUsersReadRes,
  AuthGroupUsersRef,
  AuthGroupsReadRes,
  AuthUserIdAndUsername,
  AuthUserRef,
  Dashboard,
  DashboardAuthGroups,
  DashboardGroupAuthDeleteReq,
  DashboardGroupAuthDeleteRes,
  ReadPaginationFilterFilters,
} from '../typescript/api';
import PVGridWebiny2 from '../pv-react/PVGridWebiny2';
import {
  CellClickedEvent,
  CellValueChangedEvent,
  ColDef,
  IGetRowsParams,
  RowEvent,
} from 'ag-grid-community';
import styles from './DashboardAuthGroupsView.module.scss';
import NotificationManager, {
  MessageRefs,
} from '../components/NotificationManager';
import { deepEqual } from '../../utils';
import { useNavigate } from 'react-router-dom';
import SimpleTextEditor from '../pv-react/simpleTextEditor';
import FetchDashboards from './dashboard/FetchDashboards';
import { slice } from 'cypress/types/lodash';
import AuthGroups from './authGroups/AuthGroups';
import AuthUsersGrid from '../components/AuthUsersGrid';
import useApiAndNavigate from '../hooks/useApi';
import { AxiosResponse } from 'axios';
import { useTranslation } from 'react-i18next';

const DashboardAuthGroupsView = () => {
  const { t } = useTranslation()
  const [groups, setAuthGroups] = useState<AuthGroupRef[]>([]);
  const [from, setFrom] = useState<number>(1);
  const [to, setTo] = useState<number>(100);
  const [filters, setFilters] = useState<{
    [key: string]: ReadPaginationFilterFilters;
  }>({
    groupName: { filter: '', filterType: 'text', type: 'contains' },
  });
  const { fetchDataAndNavigate } = useApiAndNavigate();
  const [fromDashboards, setFromDashboards] = useState<number>(1);
  const [toDashboards, setToDashboards] = useState<number>(100);
  const [filtersDashboards, setFiltersDashboards] = useState<{
    [key: string]: ReadPaginationFilterFilters;
  }>({
    groupName: { filter: '', filterType: 'text', type: 'contains' },
  });

  const [fromUsers, setFromUsers] = useState<number>(1);
  const [toUsers, setToUsers] = useState<number>(100);
  const [filtersUsers, setFiltersUsers] = useState<{
    [key: string]: ReadPaginationFilterFilters;
  }>({
    groupName: { filter: '', filterType: 'text', type: 'contains' },
  });

  const [cols, setCols] = useState<ColDef[]>([
    {
      headerName: t('Name'),
      field: 'name',
      filter: true,
      sortable: true,
    },
    {
      headerName: t('Create'),
      field: 'create',
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: 'agCheckboxCellRenderer',
    },
    {
      headerName: t('Read'),
      field: 'read',
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: 'agCheckboxCellRenderer',
    },
    {
      headerName: t('Update'),
      field: 'update',
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: 'agCheckboxCellRenderer',
    },
    {
      headerName: t('Delete'),
      field: 'delete',
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: 'agCheckboxCellRenderer',
    },
    {
      headerName: t('Owner'),
      field: 'owner',
      filter: true,
      sortable: true,
    },
    {
      headerName: 'Id',
      field: 'id',
      filter: true,
      sortable: true,
    },
    {
      headerName: t('Folder'),
      field: 'folder',
      filter: true,
      sortable: true,
    },
  ]);

  const [addMode, setAddMode] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<AuthGroupRef | null>();
  const [selectedUser, setSelectedUser] = useState<AuthUserRef | null>();
  const [dashboardsChanged, setDashboardsChanged] = useState<
    AuthGroupDashboardRef[]
  >([]);
  const [selectedDashboard, setSelectedDashboard] =
    useState<Dashboard | null>();
  const [groupsChanged, setGroupsChanged] = useState<AuthGroupRef[]>([]);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [users, setUsers] = useState<AuthUserIdAndUsername[]>([]);
  const navigate = useNavigate();
  const [totalGroups, setTotalGroups] = useState<number>();
  const [totalUsers, setTotalUsers] = useState<number>();
  const [totalDashboards, setTotalDashboards] = useState<number>();
  const [addDashboard, setAddDashboard] = useState(false);
  const [addUsers, setAddUsers] = useState(false);
  const [newDashboards, setNewDashboards] = useState<AuthGroupDashboardRef[]>(
    [],
  );
  const [newUsers, setNewUsers] = useState<AuthUserRef[]>([]);
  const [dashboardsToBeDeleted, setDashboardstoBeDeleted] =
    useState<string[]>();
  const notificationManagerRef = useRef<MessageRefs>();
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isLoading3, setIsLoading3] = useState(false);

  const fetchAuthGroups = async () => {
    setIsLoading1(true);

    const res = (await fetchDataAndNavigate(readAuthGroups, {
      from: 1,
      to: 100,
      filters: {},
    })) as AxiosResponse<AuthGroupsReadRes>;

    if (res?.status === 404) {
      setAuthGroups([]);
      setTotalGroups(0);
      setIsLoading1(false);
      return;
    } else if (res?.status === 500) {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Something went wrong. Could not fetch')} Auth Group(s)!`,
      );
      setAuthGroups([]);
      setTotalGroups(0);
      setIsLoading1(false);
      return;
    }
    const authGroups = res?.data.authGroups;

    authGroups && setAuthGroups(authGroups);
    setTotalGroups(res?.data.totalGroups);
    setIsLoading1(false);
  };

  const updateGroups = async () => {
    if (groupsChanged.length === 0) return;
    const fails = [];

    for (const [index, group] of groupsChanged.entries()) {
      const res = (await fetchDataAndNavigate(updateAuthGroups, {
        id: group.id,
        name: group.name,
      })) as AxiosResponse<AuthGroupUpdateRes>;
      if (res.status !== 200) {
        notificationManagerRef?.current?.addMessage(
          'error',
          t('Error'),
          `${t('Something went wrong. Could not update Auth Group to ')}${group.name}.`,
        );
        fails.push(res.status);
      }

      if (index === groupsChanged.length - 1 && fails.length === 0) {
        notificationManagerRef?.current?.addMessage(
          'success',
          t('Success'),
          t(`Auth Group(s) updated.`),
        );
      }
    }
  };

  const fetchAuthGroupDashboards = async () => {
    if (!selectedGroup?.id) return;
    setIsLoading2(true);

    const obj: AuthGroupDashboardsReadReq = {
      id: selectedGroup.id,
      name: selectedGroup.name,
      filters: filtersDashboards,
      from: fromDashboards || 1,
      to: toDashboards || 1,
    };

    try {
      const res = (await fetchDataAndNavigate(
        readAuthGroupsDashboards,
        obj,
      )) as AxiosResponse<AuthGroupDashboardsReadRes>;
      const dashboards = res?.data.dashboards;
      const totalCount = res?.data.count;

      dashboards && setDashboards(dashboards);
      totalCount && setTotalDashboards(totalCount);
    } catch (error) {
      if (error?.status === 404) {
        setDashboards([]);
        setTotalDashboards(0);
      } else if (error?.status === 500) {
        notificationManagerRef?.current?.addMessage(
          'error',
          t('Error'),
          `${t('Something went wrong. Could not fetch')} Dashboard(s)!`,
        );
      }
    }

    setIsLoading2(false);
  };

  const fetchAuthGroupUsers = async () => {
    if (!selectedGroup?.id) return;
    setIsLoading3(true);

    const req: AuthGroupUsersReadReq = {
      id: selectedGroup.id,
      filters: filtersUsers || 1,
      from: fromUsers || 1,
      to: toUsers || 1,
    };
    try {
      const res = (await fetchDataAndNavigate(
        readAuthGroupsUsers,
        req,
      )) as AxiosResponse<AuthGroupUsersReadRes>;

      const authUsers = res?.data.authUsers;
      const totalCount = res?.data.count;

      authUsers && setUsers(authUsers);
      totalCount && setTotalUsers(totalCount);
    } catch (error) {
      if (error?.status === 404) {
        setUsers([]);
        setTotalUsers(0);
      } else if (error?.status === 500) {
        notificationManagerRef?.current?.addMessage(
          'error',
          t('Error'),
          `${t('Something went wrong. Could not fetch')} Dashboard(s)!`,
        );
      }
    }
    setIsLoading3(false);
  };

  const updateAuthGroupDash = async () => {
    console.log({ dashboardsChanged })
    if (!selectedGroup?.id || !dashboardsChanged) return;

    const req: AuthGroupDashboardUpdateReq = {
      id: selectedGroup.id,
      dashboards: dashboardsChanged.reduce((acc, cur) => {
        if (!acc.some(el => el.id === cur.id)) {
          acc.push(cur)
        }
        return acc

      }, []),
      name: selectedGroup.name,
    };

    const res = (await fetchDataAndNavigate(
      updateAuthGroupDashboards,
      req,
    )) as AxiosResponse<AuthGroupDashboardUpdateRes>;

    if (res?.status === 200) {
      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        t('Dashboard(s) updated!'),
      );

      await fetchAuthGroupDashboards();
    } else {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Something went wrong. Could not update')} Dashboard(s)!`,
      );
    }
  };

  // useEffect(() => {
  //   fetchAuthGroupDashboards();
  //   fetchAuthGroupUsers();
  // }, [selectedGroup]);

  useEffect(() => {
    fetchAuthGroupDashboards();
  }, [toDashboards, fromDashboards, filtersDashboards]);

  useEffect(() => {
    fetchAuthGroupUsers();
  }, [toUsers, fromUsers, filtersUsers]);

  useEffect(() => {
    fetchAuthGroups();
  }, [filters, to, from]);

  const handleParamsChange = (params: IGetRowsParams) => {
    setFilters(params.filterModel);
    setFrom(params.startRow + 1);
    setTo(params.endRow);
  };

  const addAuthGroupDashboard = async () => {
    if (!selectedGroup?.id || !selectedGroup.name) return;
    const res = await createAuthGroupDashboards({
      name: selectedGroup.name,
      id: selectedGroup?.id,
      dashboards: newDashboards.map((dashboard) => {
        return {
          name: dashboard.name,
          id: dashboard.id,
          create: false,
          delete: false,
          read: false,
          update: false,
        };
      }),
    });

    if (res?.status === 200) {
      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        `${t('Dashboard(s) added to ')} ${selectedGroup.name}`,
      );

      await fetchAuthGroupDashboards();
    } else {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Something went wrong. Could not add')} Dashboard!`,
      );
    }
  };

  const addAuthGroupUser = async () => {
    if (!selectedGroup?.id || !selectedGroup.name) return;

    const req: AuthGroupUsersCreateReq = {
      name: selectedGroup.name,
      id: selectedGroup?.id,
      authUsers: newUsers.map((user) => {
        return {
          username: user.username,
          id: user.id,
        };
      }),
    };

    const res = (await fetchDataAndNavigate(
      createAuthGroupUsers,
      req,
    )) as AxiosResponse<AuthGroupUsersCreateRes>;

    if (res?.status === 200) {
      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        `${t('User(s) added to ')} ${selectedGroup.name}`,
      );

      await fetchAuthGroupUsers();
    } else {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Something went wrong. Could not add')} User!`,
      );
    }
  };

  const deleteDashboardsAuthGroup = async (data: DashboardAuthGroups[]) => {
    if (!selectedGroup?.id) return;

    const req: DashboardGroupAuthDeleteReq = {
      authGroups: data.map((el) => {
        return { id: el.id, name: el.name };
      }),
      id: selectedGroup?.id,
    };

    const res = (await fetchDataAndNavigate(
      deleteDashboardGroupAuth,
      req,
    )) as AxiosResponse<DashboardGroupAuthDeleteRes>;

    if (res?.status === 200) {
      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        t('Auth Group(s) deleted!'),
      );
      await fetchAuthGroupDashboards();
    } else {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        t('Something wrong happened! Could not delete'),
      );
    }
  };

  const handleGroupDashboardsDelete = async (arr: AuthGroupDashboardRef[]) => {
    if (!selectedGroup?.id) return;

    const req: AuthGroupDashboardDeleteReq = {
      id: selectedGroup.id,
      dashboardIds: arr.map((el) => el.id),
      name: selectedGroup.name
    }

    const res = await fetchDataAndNavigate(deleteAuthGroupDashboards, req);

    if (res?.status === 200) {
      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        `${t('Dashboards disassociated to ')} ${selectedGroup?.name}!`,
      );
      await fetchAuthGroupDashboards();
    } else {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Could not disassociate dashboard(s) from ')} ${selectedGroup?.name}!`,
      );
    }

    fetchAuthGroups();
  };

  const handleGroupUsersDelete = async (arr: AuthUserIdAndUsername[]) => {
    if (!selectedGroup?.id) return;

    const req: AuthGroupUsersDeleteReq = {
      id: selectedGroup?.id,
      name: selectedGroup.name,
      authUsers: arr.map((el) => { return { id: el.id, username: el.username } }),
    }

    const res = await fetchDataAndNavigate(deleteAuthGroupUsers, req);

    if (res?.status === 200) {
      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        `${t('User(s) disassociated to ')}${selectedGroup?.name}!`,
      );
      await fetchAuthGroupUsers();
    } else {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Could not disassociate user(s) from ')}${selectedGroup?.name}!`,
      );
    }

    fetchAuthGroups();
  };

  const handleCellClicked = (e: CellClickedEvent<any, any>) => {
    if (e.colDef.field !== 'click') return;
    setSelectedGroup(null);
    setTimeout(() => {
      setSelectedGroup(e.data);
    }, 1);
  };

  const handleGroupDashboards = (data: IGetRowsParams) => {
    setFromDashboards(data.startRow);
    setToDashboards(data.endRow);
    setFiltersDashboards(data.filterModel);
  };

  const handleGroupGroups = (data: IGetRowsParams) => {
    setFromUsers(data.startRow);
    setToUsers(data.endRow);
    setFiltersUsers(data.filterModel);
  };

  return (
    <div className={styles.dashboardAuthGroupsView}>
      {(addDashboard || addUsers) && (
        <div
          className={styles.dashboardAuthGroupsViewShadow}
          onClick={() => {
            setAddDashboard(false);
            setAddUsers(false);
          }}
        ></div>
      )}

      <div className={styles.dashboardAuthGroupsViewContainer}>
        {
          <div className={styles.authGroupsGrid}>
            <AuthGroups
              onCellClicked={handleCellClicked}
              onRefresh={() => fetchAuthGroups()}
              onDelete={(e) => deleteDashboardsAuthGroup(e)}
              permissions={{
                createAction: true,
                deleteAction: true,
                updateAction: true,
              }}
              updateModeOnRows={true}
              onParamsChange={handleParamsChange}
              paginationPageSize={16}
              isLoading={isLoading1}
              selectRowByCell={true}
              onRowsStateChange={(e) => {
                setAddMode(false);
                setGroupsChanged(e as AuthGroupRef[]);
              }}
            />
            {groupsChanged.length > 0 && !addMode && (
              <button onClick={() => updateGroups()}>
                {t('Update Auth Group(s)')}
              </button>
            )}
          </div>
        }
        {selectedGroup && (
          <>
            <label htmlFor="">{selectedGroup?.name} Dashboards:</label>
            <PVGridWebiny2
              add={() => setAddDashboard(true)}
              cols={cols}

              cypressAtt="group-dashboards-grid"
              rows={dashboards}
              isLoading={isLoading2}
              permissions={{
                createAction: true,
                deleteAction: true,
                updateAction: true,
              }}
              onRowsStateChange={(e) => {
                setDashboardsChanged(e as AuthGroupDashboardRef[]);
              }}
              editOnGrid={false}
              onParamsChange={handleGroupDashboards}
              updateModeOnRows={false}
              totalCount={totalDashboards}
              onUpdate={updateAuthGroupDash}
              onRowsSelected={(e) => {
                setDashboardstoBeDeleted(e.map((el) => el.data.id));
              }}
              onRefresh={() => fetchAuthGroupDashboards()}
              onDelete={handleGroupDashboardsDelete}
            />
          </>
        )}
        {selectedGroup && (
          <>
            <label htmlFor="">{selectedGroup?.name} Users:</label>
            <PVGridWebiny2
              add={() => setAddUsers(true)}
              cols={[
                {
                  headerName: t('Username'),
                  field: 'username',
                  sortable: true,

                  filter: true,
                  // cellEditor: SimpleTextEditor,
                },
                {
                  headerName: 'Id',
                  field: 'id',
                  sortable: true,
                  filter: true,
                },
              ]}
              cypressAtt="group-users-grid"
              rows={users}
              isLoading={isLoading3}
              permissions={{
                createAction: true,
                deleteAction: true,
                updateAction: true,
              }}
              onRowsStateChange={(e) => {
                setGroupsChanged(e as AuthGroupDashboardRef[]);
              }}
              onParamsChange={handleGroupGroups}
              updateModeOnRows={true}
              totalCount={totalUsers}
              onUpdate={updateAuthGroupDash}
              onRowsSelected={(e) => {
                setDashboardstoBeDeleted(e.map((el) => el.data.id));
              }}
              onRefresh={() => fetchAuthGroupUsers()}
              onDelete={handleGroupUsersDelete}
            />
          </>
        )}
        {addDashboard && (
          <div className={styles.selectGroup}>
            <FetchDashboards
              selection={true}
              dashboardsToFilterOutById={dashboards}
              onRowsSelected={(e) => setNewDashboards(e.map((el) => el.data))}
            />
            {newDashboards.length > 0 && (
              <button onClick={() => addAuthGroupDashboard()}>
                {t('Add Group(s)')}
              </button>
            )}
          </div>
        )}
        {addUsers && (
          <div className={styles.selectGroup}>
            <AuthUsersGrid
              selection={true}
              usersToFilterOutById={users}
              onRowsSelected={(e) => setNewUsers(e.map((el) => el.data))}
            />
            {newUsers.length > 0 && (
              <button onClick={() => addAuthGroupUser()}>{t('Add User(s)')}</button>
            )}
          </div>
        )}
      </div>
      <NotificationManager ref={notificationManagerRef} />
    </div>
  );
};

export default DashboardAuthGroupsView;
