import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createTable } from '../../client';
import { useTranslation } from 'react-i18next';
import {
  TableColumnRef,
  TableRef,
} from '../../pontus-api/typescript-fetch-client-generated';
import TableView from '../TableView';
import { OpenApiValidationFailError } from '../../types';
import NotificationManager, {
  MessageRefs,
} from '../../components/NotificationManager';
import { handleInputChange } from '../../../utils';

type Props = {
  testId?: string;
};

export const formatToCosmosDBPattern = (inputString: string) => {
  return inputString.trim().replace(/ /g, '-').toLowerCase();
};

const CreateTableView = ({ testId }: Props) => {
  const [name, setName] = useState<string>();
  const [errors, setErrors] = useState<OpenApiValidationFailError>();
  const notificationManagerRef = useRef<MessageRefs>();
  const [validationError, setValidationError] = useState<Record<string, any>>(
    {},
  );

  const { t, i18n } = useTranslation();

  const handleCreate = async (data: TableColumnRef[]) => {
    console.log({ data })
    const isAnyFieldInvalid = Object.values(validationError).some(
      (field) => field,
    );
    console.log({ validationError })
    if (isAnyFieldInvalid) return;

    let colsEmpty = false;

    console.log({ data })
    for (const [key, value] of Object.entries(data)) {
      if (!value.headerName || !value.field) {
        colsEmpty = true;
      }
    }

    try {
      console.log({ name, colsEmpty })
      if (!name || colsEmpty) {
        throw t("Please, fill the empty fields.");
      }


      const obj = {
        label: name || '',
        name: name || '',
        cols: data.map((col) => {
          return {
            ...col,
            headerName: col.name || '',
            field: col.field || '',
          };
        }),
      };
      console.log({ obj })
      const createRes = await createTable(obj);

      if (createRes?.status === 400) {
        throw new Error();
      } else if (createRes?.status === 409) {
        throw t('There is already a table with that Name');
      }

      notificationManagerRef?.current?.addMessage(
        'success',
        t('Success'),
        t('Table created') + "!",
      );
    } catch (error: any) {
      console.log({ error })
      notificationManagerRef?.current?.addMessage(
        'error',
        t('Error'),
        typeof error === 'string' ? error : t('Could not create table'),
      );
    }
  };

  const checkValidationError = (message: string) => {
    if (message.startsWith('required')) {
      return t('This field is required');
    } else if (message.startsWith('pattern')) {
      return t('Special characters are not allowed');
    }
  };

  // const handleColsCreation = (data: TableColumnRef[]) => {
  //   setCols(data);
  // };

  return (
    <>
      <div className="create-table-view">
        <label htmlFor="">Name</label>
        <input
          data-testid={`${testId}-input`}
          data-cy="create-table-name-input"
          onChange={(e) => {
            setName(e.target.value);
            name && handleInputChange(e, 'name', setValidationError);
          }}
          onBlur={(e) => handleInputChange(e, 'name', setValidationError)}
          value={name}
          type="text"
          className="create-table__name-input"
        />
        {validationError?.[`name`] && (
          <p className="table-input-tooltip">{validationError?.[`name`]}</p>
        )}
        <TableView
          testId="table-view"
          onCreate={handleCreate}
          validationError={validationError}
          setValidationError={setValidationError}
          onInputChange={handleInputChange}
        />
      </div>
      <NotificationManager ref={notificationManagerRef} />
    </>
  );
};

export default CreateTableView;
