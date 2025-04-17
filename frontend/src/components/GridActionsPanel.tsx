import { Dispatch, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/esm/Button';
import { BsFillTrash2Fill } from 'react-icons/bs';
import { GrUpdate } from 'react-icons/gr';
import { FaPlusCircle } from 'react-icons/fa';
import { IRowNode } from 'ag-grid-community';
import { IoIosSave } from 'react-icons/io';
import { useTranslation } from 'react-i18next';

type Props = {
  deleteMode?: boolean;
  updateMode?: boolean;
  setGridKey?: Dispatch<React.SetStateAction<number>>;
  setFlexModelId?: Dispatch<React.SetStateAction<string | undefined>>;
  setOpenNewEntryView?: React.Dispatch<React.SetStateAction<boolean>>;
  setModelId?: React.Dispatch<React.SetStateAction<string | undefined>>;
  updateModelId?: string | undefined;
  setDeletion?: Dispatch<React.SetStateAction<boolean>>;
  id?: string;
  setShowColumnSelector?: Dispatch<React.SetStateAction<boolean>>;
  setDeleteMode?: Dispatch<React.SetStateAction<boolean>>;
  setUpdateMode?: Dispatch<React.SetStateAction<boolean>>;
  onRefresh?: () => void;
  configTableId?: string;
  add?: () => void;
  permissions?: {
    updateAction?: boolean;
    createAction?: boolean;
    deleteAction?: boolean;
    readAction?: boolean;
  };
  onDelete?: (arr: any[]) => void;
  onUpdate?: () => void;
  entriesToBeDeleted: IRowNode<any>[];
  testId?: string;
  changesMade?: boolean;
  updateModeOnRows?: boolean;
  onEditOnGrid?: (val: boolean) => void;
};

const GridActionsPanel = ({
  deleteMode,
  onRefresh,
  updateMode,
  setGridKey,
  setFlexModelId,
  setOpenNewEntryView,
  setModelId,
  updateModelId,
  setDeletion,
  id,
  add,
  setShowColumnSelector,
  setDeleteMode,
  setUpdateMode,
  configTableId,
  entriesToBeDeleted,
  permissions,
  onDelete,
  testId,
  changesMade,
  updateModeOnRows = false,
  onUpdate,
  onEditOnGrid
}: Props) => {
  const [cmpWidth, setCmpWidth] = useState<number>();
  const [openActionsPanel, setOpenActionsPanel] = useState(false);

  const { t } = useTranslation()
  var windowWidth = window.innerWidth;

  const burguerMenu = useRef<any>();

  const changeBurguerMenuValue = (value: boolean, display?: string) => {
    if (burguerMenu.current) {
      burguerMenu.current.checked = value;
      setOpenActionsPanel(value);
      burguerMenu.current.style.display = display ? display : '';
    }
  };

  useEffect(() => {
    const cmpWidth = (document.querySelector('body') as HTMLElement)
      ?.offsetWidth;
    setCmpWidth(cmpWidth);
  }, [windowWidth]);

  useEffect(() => {
    console.log({ updateModeOnRows })
  }, [updateModeOnRows])


  if (!!cmpWidth && cmpWidth < 514) {
    return (
      <>
        <div className="grid-actions-panel__toolbar">
          <label
            ref={burguerMenu}
            onClick={(e: React.MouseEvent<HTMLLabelElement>) => {
              const target = e.target as HTMLInputElement;
              setOpenActionsPanel(target?.checked);
            }}
            className="hamburguer-menu grid-actions-panel__burguer-menu"
          >
            <input type="checkbox" />
          </label>
          {deleteMode && (
            <div
              style={{
                gap: '1rem',
                height: '2.65rem',
                display: 'flex',
                alignItems: 'center',
              }}
              className="grid-actions-panel__delete-actions"
            >
              <BsFillTrash2Fill
                onClick={() => {
                  setModelId && setModelId(configTableId);
                  // entriesToBeDeleted &&
                  //   entriesToBeDeleted.length > 0 &&
                  setDeletion && setDeletion(true);
                }}
              />
              <i
                className="fa-solid fa-x "
                onClick={() => {
                  changeBurguerMenuValue(true, 'flex');
                  setDeleteMode && setDeleteMode(false);
                }}
              ></i>
            </div>
          )}
          {updateMode && (
            <div className="grid-actions-panel__update-actions">
              <i
                className="fa-solid fa-x"
                onClick={() => {
                  changeBurguerMenuValue(true, 'flex');
                  setUpdateMode && setUpdateMode(false);
                }}
              ></i>
            </div>
          )}
        </div>
        <div
          className={`grid-actions-panel ${openActionsPanel ? 'active' : ''}`}
        >
          {deleteMode || updateMode || (
            <Button
              className="grid-actions-panel__plus-btn btn"
              data-testid={`${testId}-add-btn`}
              onClick={() => {
                setFlexModelId && setFlexModelId(id);
                setOpenNewEntryView && setOpenNewEntryView(true);
                setModelId &&
                  setModelId((prevState) =>
                    updateModelId
                      ? (prevState = updateModelId)
                      : (prevState = configTableId),
                  );
                add && add();
              }}
            >
              +
            </Button>
          )}
          {updateMode || deleteMode || (
            <Button
              className="grid-actions-panel__restore-btn btn"
              onClick={() => {
                setGridKey && setGridKey((prevState) => prevState + 1);
              }}
            >
              restore
            </Button>
          )}
          {updateMode || deleteMode || (
            <Button
              className="grid-actions-panel__select-btn btn"
              onClick={() => {
                setShowColumnSelector && setShowColumnSelector(true);
              }}
            >
              Select Columns
            </Button>
          )}
          {updateMode || deleteMode || (
            <Button
              name="delete-mode"
              className="grid-actions-panel__delete-btn btn"
              onClick={() => {
                changeBurguerMenuValue(false, 'none');
                setDeleteMode && setDeleteMode(!deleteMode);
              }}
            >
              Delete Mode
            </Button>
          )}
          {(<>
            <label class="switch">
              <input type="checkbox" />
              <span class="slider round"></span>
            </label>
            <Button
              name="edit-on-grid-mode"
              data-cy="edit-on-grid-toggle"
              className="grid-actions-panel__edit-on-grid-btn btn"
              onClick={(e) => {
                onEditOnGrid && onEditOnGrid(e.target.checked);
              }}
            >
              Edit on Grid
            </Button>
          </>
          )}
          {updateMode || deleteMode || (
            <Button
              className="grid-actions-panel__update-btn btn"
              onClick={() => {
                changeBurguerMenuValue(false, 'none');
                setUpdateMode && setUpdateMode(!updateMode);
              }}
            >
              {t('Update Mode')}
            </Button>
          )}
        </div>
      </>
    );
  }


  return (
    <div className="grid-actions-panel">
      {deleteMode ||
        updateMode ||
        (permissions?.createAction && (
          <FaPlusCircle
            data-testid={`${testId}-add-btn`}
            data-cy="grid-add-btn"
            className="grid-actions-panel__plus-btn text-5xl cursor-pointer"
            // style={{
            //   display: 'flex',
            //   alignItems: 'center',
            //   padding: 0,
            //   cursor: 'pointer',
            //   height: '2rem',
            //   fontSize: '4rem',
            //   left: '8rem',
            // }}
            onClick={() => {
              setFlexModelId && setFlexModelId(id);
              setOpenNewEntryView && setOpenNewEntryView(true);
              setModelId &&
                setModelId((prevState) =>
                  updateModelId
                    ? (prevState = updateModelId)
                    : (prevState = configTableId),
                );
              add && add();
            }}
          />
        ))}

      {updateMode || deleteMode || (
        <GrUpdate
          className="grid-actions-panel__restore-btn"
          onClick={() => {
            onRefresh && onRefresh();
          }}
          data-cy="grid-action-refresh-btn"
          data-testid={`${testId}-refresh-btn`}
        />
      )}

      {updateMode || deleteMode || (
        <button
          className="grid-actions-panel__select-btn"
          onClick={() => {
            setShowColumnSelector && setShowColumnSelector(true);
          }}
        >
          {t('Select Columns')}
        </button>
      )}

      {updateMode ||
        deleteMode ||
        (permissions?.deleteAction && (
          <button
            name="delete-mode"
            data-testid={`${testId}-delete-mode`}
            className="grid-actions-panel__delete-btn"
            onClick={() => {
              setDeleteMode && setDeleteMode(true);
            }}
          >
            {updateModeOnRows} {t('Delete Mode')}
          </button>
        ))}
      {(!deleteMode && permissions?.updateAction && !updateMode) && (
        (
          <button
            data-testid={`${testId}-update-mode`}
            className="grid-actions-panel__update-btn"
            onClick={() => {
              setUpdateMode && setUpdateMode(!updateMode);
            }}
          >
            {t('Update Mode')}
          </button>
        )
      )}

      {(<div style={{ height: "2.2rem", border: '2px solid black', borderRadius: '.5rem', padding: '.2em', display: 'flex', alignItems: 'center', gap: '3px' }}>
        <label style={{ fontSize: '100%' }}>{t('Edit on Grid')}</label>
        <label class="switch" data-cy="edit-on-grid-toggle">

          <input type="checkbox"
            onClick={(e) => {
              onEditOnGrid && onEditOnGrid(e.target.checked);
            }}
          />
          <span class="slider round"></span>
        </label>
      </div>)}


      {!updateModeOnRows && (updateMode ||
        deleteMode ||
        (permissions?.updateAction &&
          (changesMade && (
            <div
              data-cy="grid-action-panel-save-btn"
              onClick={() => {
                onUpdate && onUpdate();
              }}
            >
              <IoIosSave style={{ fontSize: '1.3rem' }} />
            </div>
          ))))}
      {deleteMode && (
        <div
          style={{
            gap: '1rem',
            height: '2.65rem',
            display: 'flex',
            alignItems: 'center',
          }}
          className="grid-actions-panel__delete-actions"
        >
          <i
            className="fa-solid fa-trash"
            data-testid={`${testId}-delete-btn`}
            data-cy={`grid-delete-btn`}
            aria-label="trash-icon"
            aria-hidden="true"
            onClick={() => {
              if (entriesToBeDeleted && onDelete) {
                onDelete(entriesToBeDeleted);
                setDeleteMode && setDeleteMode(false);
              }
            }}
            style={{ fontSize: '1.8rem', color: '#b53737', cursor: 'pointer' }}
          ></i>
          <i
            className="fa-solid fa-x"
            style={{ fontSize: '1.8rem', cursor: 'pointer' }}
            onClick={() => {
              setDeleteMode && setDeleteMode(false);
            }}
          ></i>
        </div>
      )}

      {updateMode && (
        <div className="grid-actions-panel__update-actions">
          <i
            className="fa-solid fa-x"
            style={{
              fontSize: '1.8rem',
              cursor: 'pointer',
              height: '2.65rem',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => {
              setUpdateMode && setUpdateMode(false);
            }}
          ></i>
        </div>
      )}
    </div>
  );
};
export default GridActionsPanel;
