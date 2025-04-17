import { useEffect, useRef, useState } from 'react';
import {
  createAuthGroup,
  deleteAuthGroup,
  readAuthGroups,
  updateAuthGroups,
} from '../../client';
import { AuthGroupRef } from '../../typescript/api';
import NotificationManager, {
  MessageRefs,
} from '../../components/NotificationManager';
import PVGridWebiny2 from '../../pv-react/PVGridWebiny2';
import {
  CellClickedEvent,
  CellValueChangedEvent,
  IGetRowsParams,
  IRowNode,
} from 'ag-grid-community';
import { useTranslation } from 'react-i18next';

type Props = {
  onCellClicked?: (e: CellClickedEvent<any, any>) => void;
  onRefresh?: () => void;
  onAdd?: () => void;
  onDelete?: (arr: any[]) => void;
  onUpdate?: (data: any) => void;
  permissions?: {
    updateAction?: boolean;
    createAction?: boolean;
    deleteAction?: boolean;
    readAction?: boolean;
  };
  groupsToFilterOutById?: AuthGroupRef[];
  onRowsSelected?: (e: IRowNode<any>[]) => void;
  selection?: boolean;
  selectRowByCell?: boolean;
  onParamsChange?: (params: IGetRowsParams) => void;
  isLoading?: boolean;
  onRowsStateChange?: (data: Record<string, any>[]) => void;
  onCellsChange?: (data: CellValueChangedEvent[]) => void;
  paginationPageSize?: number
  updateModeOnRows?: boolean
};

const AuthGroups = ({
  isLoading,
  onAdd,
  onCellClicked,
  onCellsChange,
  onDelete,
  onParamsChange,
  onRefresh,
  onRowsStateChange,
  onUpdate,
  updateModeOnRows,
  selection,
  permissions,
  selectRowByCell,
  onRowsSelected,
  groupsToFilterOutById,
  paginationPageSize
}: Props) => {
  const { t } = useTranslation()
  const [totalGroups, setTotalGroups] = useState<number>();
  const [isLoading1, setIsLoading1] = useState(false);
  const [authGroups, setAuthGroups] = useState<AuthGroupRef[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<AuthGroupRef | null>();
  const notificationManagerRef = useRef<MessageRefs>();
  const [addMode, setAddMode] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [groupsChanged, setGroupsChanged] = useState<AuthGroupRef[]>([]);
  const [groupsToBeUpdated, setGroupsToBeUpdated] = useState<AuthGroupRef[]>(
    [],
  );
  const [groupsToBeAdded, setGroupsToBeAdded] = useState<AuthGroupRef | null>();

  const [reset, setReset] = useState(false);

  const fetchAuthGroups = async () => {
    setIsLoading1(true);
    const res = await readAuthGroups({ from: 1, to: 100, filters: {} });

    const authGroups = res?.data.authGroups;

    if (res?.status === 404) {
      setAuthGroups([]);
      setTotalGroups(0);
      setIsLoading1(false);
      return;
    } else if (res?.status === 500) {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Something went wrong. Could not fetch')} ${t('Auth Group(s)')}!`,
      );
      setAuthGroups([]);
      setTotalGroups(0);
      setIsLoading1(false);
      return;
    }

    if (groupsToFilterOutById) {
      const filtered = res?.data.authGroups?.filter(
        (dash1) =>
          !groupsToFilterOutById.some((dash2) => dash1.id === dash2.id),
      );

      filtered && setAuthGroups(filtered);
      setTotalGroups(filtered?.length);
    } else {
      authGroups && setAuthGroups(authGroups);
      setTotalGroups(res?.data.totalGroups);
    }
    setIsLoading1(false);
  };

  const delAuthGroup = async (arr: AuthGroupRef[]) => {
    for (const [index, group] of arr.entries()) {
      const res = await deleteAuthGroup({ id: group.id, name: group.name });

      if (index === arr.length - 1) {
        if (res?.status === 200) {
          notificationManagerRef?.current?.addMessage(
            'success',
            t('Success'),
            t(`Auth Group(s) deleted`),
          );
          await fetchAuthGroups();
        } else {
          notificationManagerRef?.current?.addMessage(
            'error',
            t('Error'),
            t(`Something wrong happened! Could not delete`),
          );
        }
      }
    }
  };

  const addGroup = async (data: AuthGroupRef) => {
    if (!addMode || data?.id) return;

    const res = await createAuthGroup({ name: data.name });

    if (res?.status === 200) {
      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        t(`AuthGroup(s) created`) + "!",
      );

      await fetchAuthGroups();
    } else {
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        `${t('Something went wrong. Could not create')} ${t('Auth Group(s)')}!`,
      );
    }

    return
  };

  const resetRowsState = () => {
    setReset(true);
    setTimeout(() => {
      setReset(false);
    }, 1);
  };

  const updateGroups = async () => {
    if (groupsChanged.length === 0) return;
    const fails = [];

    for (const [index, group] of groupsChanged.entries()) {
      if (!group.id) break;
      const res = await updateAuthGroups({ id: group.id, name: group.name });

      if (res.status !== 200) {
        notificationManagerRef?.current?.addMessage(
          'error',
          t('Error'),
          `${t('Something went wrong. Could not update')} Auth Group to ${group.name}.`,
        );
        fails.push(res.status);
      }

      if (index === groupsToBeUpdated.length - 1 && fails.length === 0) {
        notificationManagerRef?.current?.addMessage(
          'success',
          t('Success'),
          t(`Auth Group(s) updated.`),
        );
      }
    }
    resetRowsState();
    setGroupsChanged([]);
    setGroupsChanged([]);
    setGroupsToBeUpdated([]);

    setUpdateMode(false);
  };

  const handleOnCellsChange = (e: CellValueChangedEvent<any, any>[]) => {
    if (onCellsChange) {
      return onCellsChange;
    }
  };

  const handleOnAdd = () => {
    if (onAdd) {
      return onAdd;
    }

    // setAddMode(true);
    // setTotalGroups((totalGroups || 0) + 1);
    // setAuthGroups([...authGroups, { name: '', id: '' }]);
  };

  const handleRowsStateChange = (e: Record<string, any>[]) => {
    // if(authGroups.some(group=> ))
    setGroupsChanged(e as AuthGroupRef[]);

    // if (e.some((el) => !el.id)) {
    //   setAddMode(true);
    // } else {
    //   setUpdateMode(true);
    // }

    // if (addMode) {
    //   setGroupsToBeAdded(e[e.length - 1] as AuthGroupRef);
    // }
  };

  useEffect(() => {
    if (!groupsChanged[groupsChanged.length - 1]?.id) {
      setAddMode(true);
      setUpdateMode(false);
    } else {
      setAddMode(false);
      setUpdateMode(true);
    }
    if (addMode) {
      setGroupsToBeAdded(
        groupsChanged[groupsChanged.length - 1] as AuthGroupRef,
      );
    }
    setGroupsToBeUpdated(groupsChanged.filter((group) => group.id));
  }, [groupsChanged]);

  useEffect(() => {
    fetchAuthGroups();
  }, []);

  useEffect(() => {
    // groupsToBeAdded && addGroup(groupsToBeAdded);
  }, [groupsToBeAdded]);

  return (
    <>
      <PVGridWebiny2
        onCellClicked={onCellClicked}
        cypressAtt="auth-groups-grid"
        onRefresh={() => fetchAuthGroups()}
        add={() => handleOnAdd()}
        onDelete={(e) => delAuthGroup(e)}
        permissions={permissions}
        paginationPageSize={paginationPageSize}
        selection={selection}
        onParamsChange={onParamsChange}
        isLoading={isLoading1}
        onRowsSelected={onRowsSelected}
        updateModeOnRows={updateModeOnRows}
        onCreateRow={e => addGroup({ name: e.name })}
        onUpdate={updateGroups}
        resetRowsChangedState={reset}
        //onCellValueChange={(e) => addGroup(e.data)}
        onCellsChange={(e) => handleOnCellsChange(e)}
        selectRowByCell={selectRowByCell}
        onRowsStateChange={(e) => handleRowsStateChange(e)}
        cols={[
          {
            headerName: t('Name'),
            field: 'name',
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
        rows={authGroups}
        totalCount={totalGroups}
      />

      <NotificationManager ref={notificationManagerRef} />
    </>
  );
};

export default AuthGroups;
