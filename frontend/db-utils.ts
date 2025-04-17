import { Jinst, Pool } from './node-jdbc/index';
import { JDBC } from './node-jdbc/index';
export const DELTA_DB = 'deltadb'

export const classPath = process.env['CLASSPATH']?.split(',');
const deltaDb = '172.18.0.4:10000' || process.env.DELTA_DB

if (!Jinst.getInstance().isJvmCreated()) {
  Jinst.getInstance().addOption('-Xrs');
  Jinst.getInstance().setupClasspath(classPath || []); // Path to your JDBC driver JAR file
}

export const config = {
  url: `jdbc:hive2://${deltaDb || '172.18.0.4:10000'}`,   // Replace with your JDBC URL
  drivername: `org.apache.hive.jdbc.HiveDriver`, // Driver class name
  properties: {
    user: `NBuser`,
    password: ``,
  },
};

const pool = new Pool({
  url: `jdbc:hive2://${deltaDb || '172.18.0.4:10000'}`,   // Replace with your JDBC URL
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
const jdbc = new JDBC(config);

// Initialize pool
async function initializePool() {
  try {
    await pool.initialize();
    console.log('Pool initialized successfully.');
  } catch (error) {
    console.error('Error initializing the pool:', error);
  }
}

export const createConnection = async () => {
  const reservedConn = await jdbc.reserve()
  return reservedConn.conn
};

export async function runQuery(query: string) {
  try {
    const connection = await createConnection();
    const preparedStatement = await connection.prepareStatement(query); // Replace `your_table` with your actual table name

    const resultSet = await preparedStatement.executeQuery();
    const results = await resultSet.toObjArray(); // Assuming you have a method to convert ResultSet to an array

    console.log({ query, 'Query Results:': results, Qtd: results.length });

    // Remember to release the connection after you are done
    // await pool.release(connection)

    await connection.close()

    return results
  } catch (error) {
    console.error('Error executing query:', error);
  }
}


(async () => {
  try {

    // await runQuery('DELETE FROM auth_users')
    // await runQuery('DELETE FROM auth_groups')
  } catch (error) {

  }

})()
