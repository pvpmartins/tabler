import { ReadPaginationFilter, ReadPaginationFilterFilters } from './typescript/api';
import { Jinst, Pool } from '../pontus-node-jdbc/src/index';
import { JDBC } from '../pontus-node-jdbc/src/index';
import { v4 as uuidv4 } from 'uuid';
import { snakeCase } from 'lodash';
import { NotFoundError } from './generated/api';
import { IConnection } from '../pontus-node-jdbc/src/pool';

export const DELTA_DB = 'deltadb'

export const classPath = process.env['CLASSPATH']?.split(',');

if (!Jinst.getInstance().isJvmCreated()) {
  Jinst.getInstance().addOption('-Xrs');
  Jinst.getInstance().setupClasspath(classPath || []); // Path to your JDBC driver JAR file
}

export const config = {
  url: 'jdbc:hive2://delta-db:10000', // Update the connection URL according to your setup
  drivername: 'org.apache.hive.jdbc.HiveDriver', // Driver class name
  properties: {
    user: 'NBuser',
    password: '',
  },
};

const pool = new Pool({
  url: 'jdbc:hive2://delta-db:10000',   // Replace with your JDBC URL
  properties: {
    user: 'admin',           // Database username
    password: 'user'        // Database password
  },
  drivername: 'org.apache.hive.jdbc.HiveDriver', // Driver class name
  minpoolsize: 2,
  maxpoolsize: 10,
  keepalive: {
    interval: 60000,
    query: 'SELECT 1',
    enabled: true
  },
  logging: {
    level: 'info'
  }
});

// Initialize pool
async function initializePool() {
  try {
    await pool.initialize();
    console.log('Pool initialized successfully.');
  } catch (error) {
    console.error('Error initializing the pool:', error);
  }
}


export const convertToSqlFields = (data: any[]): string => {
  const fields = [];

  for (const value of data) {
    const valType = typeof value;
    if (valType === 'boolean') {
      fields.push(`${value} BOOLEAN`);
    } else if (valType === 'number') {
      fields.push(`${value} INT`);
    } else {
      fields.push(`${value} STRING`);
    }
  }

  return fields.join(', ');
};


export const updateSql = async (
  table: string,
  data: Record<string, any>,
  whereClause: string,
): Promise<Record<string, any>[]> => {
  const insertValues = [];

  if (Array.isArray(data)) {
    for (const el of data) {
      for (const [key, value] of Object.entries(el)) {
        const val = typeof value === 'string' ? `'${value}'` : value;
        insertValues.push(`${key} = ${val}`);
      }
    }
  } else {
    for (const [key, value] of Object.entries(data)) {
      const val = typeof value === 'string' ? `'${value}'` : value;
      insertValues.push(`${key} = ${val}`);
    }
  }

  const insert = `UPDATE ${table} SET ${insertValues.join(
    ', ',
  )} ${whereClause}`;

  const res2 = await runQuery(insert);
  if (+res2[0]['num_affected_rows'] === 0) {
    throw new NotFoundError(
      `did not find any record at table '${table}' (${whereClause})`,
    );
  }

  const res3 = await runQuery(
    `SELECT * FROM ${table} ${whereClause}`,
  );

  if (res3.length === 0) {
    throw new NotFoundError(
      `did not find any record at table '${table}' (${whereClause})`,
    );
  }

  return res3;
};

export const objEntriesToStr = (
  data: Record<string, any>,
): { keysStr: string; valuesStr: string } => {
  const keys = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    // keys.push(key);
    // values.push(value)

    const valType = typeof value;
    const keyType = typeof key;
    if (valType === 'boolean') {
      keys.push(`${snakeCase(key)} BOOLEAN`);
      values.push(value);
    } else if (valType === 'number') {
      keys.push(`${snakeCase(key)} INT`);
      values.push(value);
    } else {
      keys.push(`${snakeCase(key)} STRING`);
      values.push(`'${value}'`);
    }
  }

  const keysStr = keys.join(', ');
  const valuesStr = values.join(', ');
  return { keysStr, valuesStr };
};
export const generateUUIDv6 = () => {
  const uuid = uuidv4().replace(/-/g, '');
  const timestamp = new Date().getTime();

  let timestampHex = timestamp.toString(16).padStart(12, '0');
  let uuidV6 = timestampHex + uuid.slice(12);

  return uuidV6;
};
export const createSql = async (
  table: string,
  fields: string,
  data: Record<string, any>,
): Promise<Record<string, any>[]> => {
  const uuid = generateUUIDv6();

  let entries
  if (data?.id) {
    const { id, ...rest } = data
    entries = objEntriesToStr(rest);
  } else {
    entries = objEntriesToStr(data);
  }

  const keys = entries.keysStr;
  let values = entries.valuesStr;
  // const resss = await runQuery(
  //   `DROP TABLE  ${table} `,
  //   conn,
  // );

  const createQuery = `CREATE TABLE IF NOT EXISTS ${table} (${data?.id ? '' : 'id STRING, '
    } ${fields}) USING DELTA LOCATION '/data/pv/${table}';`;

  const res = await runQuery(createQuery);


  const insertFields = Array.isArray(data)
    ? Object.keys(data[0]).join(', ')
    : Object.keys(data).join(', ');

  const insertValues = [];
  if (Array.isArray(data)) {
    for (const el of data) {
      const entries = objEntriesToStr(el);
      insertValues.push(`${entries.valuesStr}`);
    }
  }

  const ids = [];

  const insert = `INSERT INTO ${table} (${data?.id ? '' : 'id, '
    } ${insertFields}) VALUES ${Array.isArray(data)
      ? insertValues
        .map((el) => {
          const uuid = generateUUIDv6();
          ids.push(uuid);
          return `('${uuid}', ${el})`;
        })
        .join(', ')
      : `('${data?.id ? data?.id : uuid}',` + values + ')'
    }`;

  const res2 = await runQuery(insert);

  const selectQuery = `SELECT * FROM ${table} WHERE ${data?.id
    ? `id = '${data?.id}'`
    : ids.length > 0
      ? ids.map((id) => `id = '${id}'`).join(' OR ')
      : `id = '${uuid}'`
    }`;

  const res3 = await runQuery(selectQuery);

  return res3;
};

//export const createConnection = async (): Promise<IConnection> => {
//};

export async function runQuery(query: string): Promise<Record<string, any>[]> {
  console.log({ query })
  try {
    const jdbc = new JDBC(config);
    const reservedConn = await jdbc.reserve()
    const connection = reservedConn.conn
    //const connection = await createConnection();
    const preparedStatement = await connection.prepareStatement(query); // Replace `your_table` with your actual table name

    const resultSet = await preparedStatement.executeQuery();
    const results = await resultSet.toObjArray(); // Assuming you have a method to convert ResultSet to an array

    // Remember to release the connection after you are done
    // await pool.release(connection)

    await connection.close()
    await jdbc.release(connection)

    //console.log({ JDBCStatus: await jdbc.status() })

    return results
  } catch (error) {
    console.error('Error executing query:', error);
  }
}

export const filterToQuery = (
  body: ReadPaginationFilter,
  alias = 'c',
  additionalClause?: string,
  onlyParams = false
) => {
  const query = [];

  let cols = body?.filters;

  const { from, to } = body;

  let colSortStr = '';
  if (process.env.DB_SOURCE && alias) {
    alias = `${alias}.`
  }

  for (let col in cols) {
    if (cols.hasOwnProperty(col)) {
      const colName =
        process.env.DB_SOURCE === DELTA_DB
          ? col.includes('-')
            ? `\`${col}\``
            : col
          : `["${col}"]`;

      const condition1Filter = cols[col]?.condition1?.filter;
      const condition2Filter = cols[col]?.condition2?.filter;
      const conditions = cols[col]?.conditions;

      const filterType = cols[col]?.filterType;

      const type = cols[col]?.type?.toLowerCase(); // When we received a object from just one colName, the property is on a higher level

      const type1 = cols[col]?.condition1?.type.toLowerCase();
      const type2 = cols[col]?.condition2?.type.toLowerCase();

      const operator = cols[col]?.operator;

      const colQuery = [];
      if (filterType === 'text') {
        const filter = cols[col]?.filter; // When we received a object from just one colName, the property is on a higher level
        if (conditions?.length > 0) {
          for (const condition of conditions) {
            if (process.env.DB_SOURCE === DELTA_DB) {
              if (type === 'contains') {
                colQuery.push(` ${alias}${colName} LIKE '%${filter}%'`);
              }

              if (type === 'notcontains') {
                colQuery.push(` ${alias}${colName} NOT LIKE '%${filter}%'`);
              }

              if (type === 'startswith') {
                colQuery.push(` ${alias}${colName} LIKE '${filter}%'`);
              }

              if (type === 'endswith') {
                colQuery.push(` ${alias}${colName} LIKE '%${filter}'`);
              }

              if (type === 'equals') {
                colQuery.push(` ${alias}${alias}${colName} = '${filter}'`);
              }

              if (type === 'notequals') {
                colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
              }
            } else {
              if (type === 'contains') {
                colQuery.push(` CONTAINS(${alias}${colName}, '${filter}')`);
              }

              if (type === 'notcontains') {
                colQuery.push(` NOT CONTAINS(${alias}${colName}, '${filter}')`);
              }

              if (type === 'startswith') {
                colQuery.push(` STARTSWITH(${alias}${colName}, '${filter}')`);
              }

              if (type === 'endswith') {
                colQuery.push(` ENDSWITH(${alias}${colName}, '${filter}')`);
              }

              if (type === 'equals') {
                colQuery.push(` ${alias}${colName} = '${filter}'`);
              }

              if (type === 'notequals') {
                colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
              }
            }
          }
        }

        if (!condition1Filter) {
          if (process.env.DB_SOURCE === DELTA_DB) {
            if (type === 'contains') {
              colQuery.push(` ${alias}${colName} LIKE '%${filter}%'`);
            }

            if (type === 'not contains') {
              colQuery.push(` ${alias}${colName} NOT LIKE '%${filter}%'`);
            }

            if (type === 'startswith') {
              colQuery.push(` ${alias}${colName} LIKE '${filter}%'`);
            }

            if (type === 'ends with') {
              colQuery.push(` ${alias}${colName} LIKE '%${filter}'`);
            }

            if (type === 'equals') {
              colQuery.push(` ${alias}${colName} = '${filter}'`);
            }

            if (type === 'not equals') {
              colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
            }
          } else {
            if (type === 'contains') {
              colQuery.push(` CONTAINS(${alias}${colName}, '${filter}')`);
            }

            if (type === 'not contains') {
              colQuery.push(` NOT CONTAINS(${alias}${colName}, '${filter}')`);
            }

            if (type === 'starts with') {
              colQuery.push(` STARTSWITH(${alias}${colName}, '${filter}')`);
            }

            if (type === 'ends with') {
              colQuery.push(` ENDSWITH(${alias}${colName}, '${filter}')`);
            }

            if (type === 'equals') {
              colQuery.push(` ${alias}${colName} = '${filter}'`);
            }

            if (type === 'not equals') {
              colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
            }
          }
        }

        if (condition1Filter && type1 === 'contains') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(` ${alias}${colName} LIKE '%${condition1Filter}%'`);
          } else {
            colQuery.push(
              ` CONTAINS(${alias}${colName}, '${condition1Filter}')`,
            );
          }
        }

        if (condition2Filter && type2 === 'contains') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(
              ` ${operator} ${alias}${colName} LIKE '%${condition2Filter}%'`,
            );
          } else {
            colQuery.push(
              ` ${operator} AND CONTAINS(${alias}${colName}, '${condition2Filter}')`,
            );
          }
        }

        if (condition1Filter && type1 === 'not contains') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(` ${alias}${colName} LIKE '%${condition1Filter}%'`);
          } else {
            colQuery.push(
              ` CONTAINS(${alias}${colName}, '${condition1Filter}')`,
            );
          }
        }

        if (condition2Filter && type2 === 'not contains') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(` AND ${alias}${colName} LIKE '%${condition2Filter}%'`);
          } else {
            colQuery.push(
              ` AND CONTAINS(${alias}${colName}, '${condition2Filter}')`,
            );
          }
        }

        if (condition1Filter && type1 === 'starts with') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(` ${alias}${colName} LIKE '${condition1Filter}%'`);
          } else {
            colQuery.push(
              ` STARTSWITH(${alias}${colName}, '${condition1Filter}')`,
            );
          }
        }

        if (condition2Filter && type2 === 'starts with') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(` AND ${alias}${colName} LIKE '${condition2Filter}%'`);
          } else {
            colQuery.push(
              ` AND STARTSWITH(${alias}${colName}, '${condition2Filter}')`,
            );
          }
        }

        if (condition1Filter && type1 === 'ends with') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(` ${alias}${colName} LIKE '%${condition1Filter}'`);
          } else {
            colQuery.push(
              ` ENDSWITH(${alias}${colName}, '${condition1Filter}')`,
            );
          }
        }

        if (condition2Filter && type2 === 'ends with') {
          if (process.env.DB_SOURCE === DELTA_DB) {
            colQuery.push(` AND ${alias}${colName} LIKE '%${condition2Filter}'`);
          } else {
            colQuery.push(
              ` ${operator} ENDSWITH(${alias}${colName}, '${condition2Filter}')`,
            );
          }
        }

        if (condition1Filter && type1 === 'equals') {
          colQuery.push(` ${alias}${colName} = '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'equals') {
          colQuery.push(
            ` ${operator} ${alias}${colName} = '${condition2Filter}'`,
          );
        }

        if (condition1Filter && type1 === 'not equals') {
          colQuery.push(` NOT ${alias}${colName} = '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'not equals') {
          colQuery.push(
            ` ${operator} NOT ${alias}${colName} = '${condition2Filter}'`,
          );
        }
      }
      if (filterType === 'number') {
        const filter = cols[col]?.filter; // When we received a object from just one colName, the property is on a higher level

        if (!condition1Filter) {
          if (process.env.DB_SOURCE === DELTA_DB) {
            if (type === 'greaterThan') {
              colQuery.push(` ${alias}${colName} > '${condition1Filter}'`);
            }

            if (type === 'greaterThanOrEquals') {
              colQuery.push(` ${alias}${colName} >= '${condition1Filter}'`);
            }
            if (type === 'lessThan') {
              colQuery.push(` ${alias}${colName} < '${condition1Filter}'`);
            }

            if (type === 'lessThanOrEquals') {
              colQuery.push(` ${alias}${colName} <= '${condition1Filter}'`);
            }

            if (type === 'equals') {
              colQuery.push(` ${alias}${colName} = '${filter}'`);
            }

            if (type === 'notEqual') {
              colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
            }

            if (type === 'inRange') {
              const filterFrom = cols[col].filter;
              const filterTo = cols[col].filterTo;
              colQuery.push(
                ` ${alias}${colName} >= '${filterFrom}' AND ${alias}${colName} <= '${filterTo}'`,
              );
            }

            if (type === 'blank') {
              colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
            }

            if (type === 'notBlank') {
              colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
            }
          }
          if (type === 'greaterThan') {
            colQuery.push(` ${alias}${colName} > '${condition1Filter}'`);
          }

          if (type === 'greaterThanOrEquals') {
            colQuery.push(` ${alias}${colName} >= '${condition1Filter}'`);
          }
          if (type === 'lessThan') {
            colQuery.push(` ${alias}${colName} < '${condition1Filter}'`);
          }

          if (type === 'lessThanOrEquals') {
            colQuery.push(` ${alias}${colName} <= '${condition1Filter}'`);
          }

          if (type === 'equals') {
            colQuery.push(` ${alias}${colName} = '${filter}'`);
          }

          if (type === 'notEqual') {
            colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
          }

          if (type === 'inRange') {
            const filterFrom = cols[col].filter;
            const filterTo = cols[col].filterTo;
            colQuery.push(
              ` ${alias}${colName} >= '${filterFrom}' AND ${alias}${colName} <= '${filterTo}'`,
            );
          }

          if (type === 'blank') {
            colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
          }

          if (type === 'notBlank') {
            colQuery.push(` NOT ${alias}${colName} = '${filter}'`);
          }
        }

        if (condition1Filter && type1 === 'greaterThan') {
          colQuery.push(` ${alias}${colName} > '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'greaterThan') {
          colQuery.push(
            ` ${operator} ${alias}${colName} > '${condition2Filter}'`,
          );
        }

        if (condition1Filter && type1 === 'greaterThanOrEquals') {
          colQuery.push(` ${alias}${colName} >= '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'greaterThanOrEquals') {
          colQuery.push(
            ` ${operator} ${alias}${colName} >= '${condition2Filter}'`,
          );
        }

        if (condition1Filter && type1 === 'lessThan') {
          colQuery.push(` ${alias}${colName} < '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'lessThan') {
          colQuery.push(
            ` ${operator} ${alias}${colName} < '${condition2Filter}'`,
          );
        }

        if (condition1Filter && type1 === 'lessThanOrEquals') {
          colQuery.push(` ${alias}${colName} <= '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'lessThanOrEquals') {
          colQuery.push(
            ` ${operator} ${alias}${colName} <= '${condition2Filter}'`,
          );
        }

        if (condition1Filter && type1 === 'equals') {
          colQuery.push(` ${alias}${colName} = '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'equals') {
          colQuery.push(
            ` ${operator} ${alias}${colName} = '${condition2Filter}'`,
          );
        }

        if (condition1Filter && type1 === 'notEquals') {
          colQuery.push(` NOT ${alias}${colName} = '${condition1Filter}'`);
        }

        if (condition2Filter && type2 === 'notEquals') {
          colQuery.push(
            ` ${operator} NOT ${alias}${colName} = '${condition2Filter}'`,
          );
        }

        if (condition1Filter && type1 === 'inRange') {
          const filterFrom = cols[col].condition1.filter;
          const filterTo = cols[col].condition1.filterTo;
          colQuery.push(
            ` ${alias}${colName} >= '${filterFrom}' AND ${alias}${colName} <= '${filterTo}'`,
          );
        }

        if (condition2Filter && type2 === 'inRange') {
          const filterFrom = cols[col].condition2.filter;
          const filterTo = cols[col].condition2.filterTo;
          colQuery.push(
            ` ${alias}${colName} >= '${filterFrom}' AND ${alias}${colName} <= '${filterTo}'`,
          );
        }

        if (condition1Filter && type1 === 'blank') {
          colQuery.push(
            ` ${alias}${colName} = '' AND ${alias}${colName} = null`,
          );
        }

        if (condition2Filter && type2 === 'blank') {
          colQuery.push(
            ` ${operator} ${alias}${colName} = '' AND ${alias}${colName} = null`,
          );
        }

        if (condition1Filter && type1 === 'notBlank') {
          colQuery.push(
            ` ${alias}${colName} != '' AND ${alias}${colName} != null`,
          );
        }

        if (condition2Filter && type2 === 'notBlank') {
          colQuery.push(
            ` ${operator} ${alias}${colName} != '' AND ${alias}${colName} != null`,
          );
        }
      }

      if (filterType === 'date') {
        const date1 =
          cols[col]?.condition1?.dateFrom &&
          convertToISOString(cols[col]?.condition1?.dateFrom);
        const date2 =
          cols[col]?.condition2?.dateFrom &&
          convertToISOString(cols[col]?.condition2?.dateFrom);

        const condition1DateFrom =
          cols[col]?.condition1?.dateFrom &&
          convertToISOString(cols[col]?.condition1?.dateFrom);
        const condition2DateFrom =
          cols[col]?.condition2?.dateFrom &&
          convertToISOString(cols[col]?.condition2?.dateFrom);

        const condition1DateTo =
          cols[col]?.condition1?.dateTo &&
          convertToISOString(cols[col]?.condition1?.dateTo);
        const condition2DateTo =
          cols[col]?.condition2?.dateTo &&
          convertToISOString(cols[col]?.condition2?.dateTo);

        if (!cols[col]?.condition1) {
          const date =
            cols[col].dateFrom && convertToISOString(cols[col].dateFrom);

          if (type === 'greaterthan') {
            colQuery.push(`${alias}${colName} > '${date}'`);
          }

          if (type === 'lessthan') {
            colQuery.push(` ${alias}${colName} < '${date}'`);
          }

          if (type === 'inrange') {
            const dateFrom =
              cols[col].dateFrom && convertToISOString(cols[col].dateFrom);
            const dateTo =
              cols[col].dateTo && convertToISOString(cols[col].dateTo);
            colQuery.push(
              ` ${alias}${colName} >= '${dateFrom}' AND ${alias}${colName} <= '${dateTo}'`,
            );
          }

          if (type === 'equals') {
            colQuery.push(` ${alias}${colName} = '${date}'`);
          }

          if (type === 'notequal') {
            colQuery.push(` ${alias}${colName} != '${date}'`);
          }

          if (type === 'blank') {
            colQuery.push(
              ` ${alias}${colName} = '' AND ${alias}${colName} = null`,
            );
          }

          if (type === 'notblank') {
            colQuery.push(
              ` ${alias}${colName} != '' AND ${alias}${colName} != null`,
            );
          }
        }

        if (condition1DateFrom && type1 === 'greaterthan') {
          colQuery.push(` ${alias}${colName} > '${date1}'`);
        }

        if (condition2DateFrom && type2 === 'greaterthan') {
          colQuery.push(` ${operator} ${alias}${colName} > '${date2}'`);
        }

        if (condition1DateFrom && type1 === 'lessthan') {
          colQuery.push(` ${alias}${colName} < '${date1}'`);
        }

        if (condition2DateFrom && type2 === 'lessthan') {
          colQuery.push(` ${operator} ${alias}${colName} < '${date2}'`);
        }

        if (condition1DateFrom && type1 === 'blank') {
          colQuery.push(
            ` ${alias}${colName} = '' AND ${alias}${colName} = null`,
          );
        }

        if (condition2DateFrom && type2 === 'blank') {
          colQuery.push(
            ` ${operator} ${alias}${colName} = '' AND ${alias}${colName} = null`,
          );
        }

        if (condition1DateFrom && type1 === 'notblank') {
          colQuery.push(
            ` ${alias}${colName} != '' AND ${alias}${colName} != null`,
          );
        }

        if (condition2DateFrom && type2 === 'notblank') {
          colQuery.push(
            ` ${operator} ${alias}${colName} != '' AND ${alias}${colName} != null`,
          );
        }

        if (condition1DateFrom && type1 === 'equals') {
          colQuery.push(` ${alias}${colName} = ${condition1DateFrom}`);
        }

        if (condition2DateFrom && type2 === 'equals') {
          colQuery.push(
            ` ${operator} ${alias}${colName} = ${condition2DateFrom}`,
          );
        }

        if (condition1DateFrom && type1 === 'notequal') {
          colQuery.push(` ${alias}${colName} != ${condition1DateFrom}`);
        }

        if (condition2DateFrom && type2 === 'notequal') {
          colQuery.push(
            ` ${operator} ${alias}${colName} != ${condition2DateFrom}`,
          );
        }

        if (condition1DateFrom && type1 === 'inrange') {
          const multiCol = Object.keys(cols).length > 1;
          colQuery.push(
            ` ${multiCol ? '(' : ''
            }${alias}${colName} >= '${condition1DateFrom}' AND ${alias}${colName} <= '${condition1DateTo}'` +
            (condition2DateFrom ? ')' : ''),
          );
        }

        if (condition2DateFrom && type2 === 'inrange') {
          const multiCol = Object.keys(cols).length > 1;
          colQuery.push(
            ` ${operator} (${alias}${colName} >= '${condition2DateFrom}' AND ${alias}${colName} <= '${condition2DateTo}'${multiCol ? ')' : ''
            }`,
          );
        }
      }

      const colSort = cols[col].sort;

      if (!!colSort) {
        colSortStr = `${alias}${colName} ${colSort}`;
      }
      const colQueryStr = colQuery.join('').trim();

      if (process.env.DB_SOURCE === DELTA_DB) {
        query.push(`${colQueryStr}`);
      } else {
        query.push(colQuery.length > 1 ? `(${colQueryStr})` : `${colQueryStr}`);
      }
    }
  }

  const sorting = body?.sortModel?.[0]

  const sortingStr = sorting ? ` ORDER BY ${alias}${sorting.colId} ${sorting.sort.toUpperCase()}` : ''

  for (let i = 0; i < query.length; i++) {
    // Replace the first occurrence of 'WHERE' with 'AND' in each element
    if (i > 0) {
      query[i] = query[i].replace('WHERE', 'AND');
    }
  }

  const hasFilters = Object.keys(body?.filters || {}).length > 0;
  const fromTo =
    process.env.DB_SOURCE === DELTA_DB
      ? ` ${to ? 'LIMIT ' + (to - from) : ''} ${from ? ' OFFSET ' + (from - 1) : ''
      }`
      : `${from ? ' OFFSET ' + (from - 1) : ''} ${to ? 'LIMIT ' + (to - from) : ''
      }`;

  const finalQuery = (
    (hasFilters && !onlyParams ? ' WHERE ' : '') +
    query.join(' and ') +
    (colSortStr ? ` ORDER BY ${colSortStr}` : '') +
    (additionalClause
      ? ` ${hasFilters ? 'AND' : 'WHERE'} ${additionalClause}`
      : '') + sortingStr +
    fromTo
  ).trim();

  return finalQuery;
};

const convertToISOString = (dateString) => {
  const parts = dateString.split(' ');
  const dateParts = parts[0].split('-');
  const timeParts = parts[1].split(':');

  const date = new Date(
    Date.UTC(
      dateParts[0],
      dateParts[1] - 1,
      dateParts[2],
      timeParts[0],
      timeParts[1],
      timeParts[2],
    ),
  );

  const year = date.getUTCFullYear();
  const month = ('0' + (date.getUTCMonth() + 1)).slice(-2); // Months are 0-indexed, so we add 1. Also, we add a leading zero if necessary.
  const day = ('0' + date.getUTCDate()).slice(-2); // Add a leading zero if necessary.
  const hours = ('0' + date.getUTCHours()).slice(-2); // Add a leading zero if necessary.
  const minutes = ('0' + date.getUTCMinutes()).slice(-2); // Add a leading zero if necessary.
  const seconds = ('0' + date.getUTCSeconds()).slice(-2); // Add a leading zero if necessary.

  const isoDateString =
    year +
    '-' +
    month +
    '-' +
    day +
    'T' +
    hours +
    ':' +
    minutes +
    ':' +
    seconds +
    'Z';

  return isoDateString;
};

export const filtersToSnakeCase = (data: ReadPaginationFilter): Record<string, ReadPaginationFilterFilters> => {
  const filtersSnakeCase: Record<string, ReadPaginationFilterFilters> = {};

  for (const prop in data.filters) {
    const snakeKey = snakeCase(prop);

    filtersSnakeCase[snakeKey] = {
      ...data.filters[prop],
      filter: typeof data.filters[prop].filter === "string"
        ? snakeCase(data.filters[prop].filter as string)
        : data.filters[prop].filter,
    };
  }

  return filtersSnakeCase;
};

export const isJSONParsable = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};
export function isEmpty(obj) {
  for (var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }

  return true
}
