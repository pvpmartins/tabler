import { defineConfig } from 'cypress';
import { runQuery } from './dist/db-utils.js';
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  e2e: {
    env: {
      nodeAppUrl: 'http://frontend-server:5173',
    },
    defaultCommandTimeout: 30000,
    video: false,
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        async resetDatabaseTablesTest() {  // ✅ No need for an extra Promise wrapper

          const deleteTable = async (table: string) => {
            try {

            } catch (error) {

            }

          }
          try {
            const createUsers = await runQuery('CREATE TABLE IF NOT EXISTS auth_users (username STRING, password STRING) USING DELTA LOCATION "/data/pv/auth_users";');
            const deleteUsers = await runQuery('DELETE FROM auth_users;');
            const createGroups = await runQuery('CREATE TABLE IF NOT EXISTS auth_groups (id STRING, name STRING, create_table BOOLEAN , read_table BOOLEAN , update_table BOOLEAN , delete_table BOOLEAN ) USING DELTA LOCATION "/data/pv/auth_groups";');
            const deleteGroups = await runQuery('DELETE FROM auth_groups;');
            const createTables = await runQuery('CREATE TABLE IF NOT EXISTS tables (id STRING, name STRING, label STRING, cols ARRAY<STRUCT<id STRING, name STRING, field STRING, sortable BOOLEAN, header_name STRING, filter BOOLEAN, kind STRING, pivotIndex description STRING, regex STRING>>) USING DELTA LOCATION "/data/pv/tables";');
            const deleteTables = await runQuery('DELETE FROM tables;');
            const createGroupsUsers = await runQuery('CREATE TABLE IF NOT EXISTS groups_users (id STRING,  table_from__id STRING, table_from__name STRING, table_to__id STRING, table_to__username STRING, edge_label STRING) USING DELTA LOCATION "/data/pv/groups_users";');
            const deleteGroupsUsers = await runQuery('DELETE FROM groups_users;');
            const createMenu = await runQuery('CREATE TABLE IF NOT EXISTS menu (id STRING, tree_obj_str STRING) USING DELTA LOCATION "/data/pv/menu";');
            const deleteMenu = await runQuery('DELETE FROM menu;');
            const createDashboards = await runQuery('CREATE TABLE IF NOT EXISTS dashboards (name STRING, owner STRING, state STRING, folder STRING) USING DELTA LOCATION "/data/pv/dashboards";');
            const deleteDashboards = await runQuery('DELETE FROM dashboards;');
            const createTable1 = await runQuery('CREATE TABLE IF NOT EXISTS table_1 (username STRING, password STRING) USING DELTA LOCATION "/data/pv/table_1";');
            const deleteTable1 = await runQuery('DELETE FROM table_1')
            const createTable2 = await runQuery('CREATE TABLE IF NOT EXISTS table_2 (username STRING, password STRING) USING DELTA LOCATION "/data/pv/table_2";');
            const deleteTable2 = await runQuery('DELETE FROM table_2')

            return { deleteGroups, deleteUsers };  // ✅ Directly return result
          } catch (error) {
            console.error('Database reset failed:', error);
            throw new Error(error);  // ✅ Ensure Cypress receives the error
          }
        },
        async resetDatabaseUsers() {  // ✅ No need for an extra Promise wrapper
          return null
          try {
            const deleteUsers = await runQuery('DELETE FROM auth_users;');
            const deleteGroups = await runQuery('DELETE FROM auth_groups;');
            const deleteGroupsUsers = await runQuery('DELETE FROM groups_users;');

            return { deleteGroups, deleteUsers };  // ✅ Directly return result
          } catch (error) {
            console.error('Database reset failed:', error);
            throw new Error(error);  // ✅ Ensure Cypress receives the error
          }
        },
        async resetDatabaseAuthGroups() {  // ✅ No need for an extra Promise wrapper
          try {
            return null
            const deleteUsers = await runQuery('DELETE FROM auth_users;');
            const deleteGroups = await runQuery('DELETE FROM auth_groups;');
            const deleteGroupsUsers = await runQuery('DELETE FROM groups_users;');
            const deleteGroupsDashboards = await runQuery('DELETE FROM groups_dashboards;');
            const deleteDashboards = await runQuery('DELETE FROM dashboards;');
            const deleteTables = await runQuery('DELETE FROM tables;');
            const insertTable = await runQuery('INSERT INTO tables (id, name, label, cols) VALUES ("0195a1fc391343e58793727991e8ca40", "table_1", "Table 1", array(struct("0195a1fc3a154a08a140a4c361b49c44", "column_1", "column_1", false, "column 1", false, "checkboxes", "1", null, null), struct("0195a1fc3a154a47a800e7fde129c5d3", "column_2", "column_2", false, "column 2", false, "checkboxes", "2", null, null)));')
            const insertDash = await runQuery("INSERT INTO dashboards (id, name, folder, state, owner) VALUES (" +
              "'0195a4c3adc640b0a54020f8594ec153', " +
              "'Dash 1', " +
              "'/', " +
              "'{\"global\":{}, \"borders\":[], \"layout\": {\"type\": \"row\", \"id\": \"#c4054161-d40e-4c2f-bef9-f60475ee1425\", \"children\": [" +
              "{\"type\": \"tabset\", \"id\": \"#4314298d-3151-4a53-8d5b-0203728343b4\", \"weight\": 50, \"children\": [" +
              "{\"type\": \"tab\", \"id\": \"#327dde1e-6484-432d-beb7-71031c21b663\", \"name\": \"table_1\", \"component\": \"PVGridWebiny2\", " +
              "\"config\": {\"title\": \"table_1\", \"tableId\": \"0195a1fc391343e58793727991e8ca40\", \"lastState\": [], \"height\": 480}}" +
              "]}," +
              "{\"type\": \"tabset\", \"id\": \"#de482326-ef63-40a7-93d1-a3cad1b10bdd\", \"weight\": 50, \"children\": [" +
              "{\"type\": \"tab\", \"id\": \"#ada05336-b3e4-45ec-b014-3d59f7a21152\", \"name\": \"PVDoughnutChart2\", \"component\": \"PVDoughnutChart2\", " +
              "\"config\": {\"lastState\": []}}" +
              "], \"active\": true}" +
              "]}}', " +
              "'Admin 1'" +
              ");")
            const insertDash2 = await runQuery("INSERT INTO dashboards (id, name, folder, state, owner) VALUES (" +
              "'0195a560d6b241f6aea740447de06d9d', " +
              "'Dash 2', " +
              "'/', " +
              "'{\"global\":{}, \"borders\":[], \"layout\": {\"type\": \"row\", \"id\": \"#c4054161-d40e-4c2f-bef9-f60475ee1425\", \"children\": [" +
              "{\"type\": \"tabset\", \"id\": \"#4314298d-3151-4a53-8d5b-0203728343b4\", \"weight\": 50, \"children\": [" +
              "{\"type\": \"tab\", \"id\": \"#327dde1e-6484-432d-beb7-71031c21b663\", \"name\": \"table_1\", \"component\": \"PVGridWebiny2\", " +
              "\"config\": {\"title\": \"table_1\", \"tableId\": \"0195a1fc391343e58793727991e8ca40\", \"lastState\": [], \"height\": 480}}" +
              "]}," +
              "{\"type\": \"tabset\", \"id\": \"#de482326-ef63-40a7-93d1-a3cad1b10bdd\", \"weight\": 50, \"children\": [" +
              "{\"type\": \"tab\", \"id\": \"#ada05336-b3e4-45ec-b014-3d59f7a21152\", \"name\": \"PVDoughnutChart2\", \"component\": \"PVDoughnutChart2\", " +
              "\"config\": {\"lastState\": []}}" +
              "], \"active\": true}" +
              "]}}', " +
              "'Admin 1'" +
              ");")

            return { deleteGroups, deleteUsers };  // ✅ Directly return result
          } catch (error) {
            console.error('Database reset failed:', error);
            throw new Error(error);  // ✅ Ensure Cypress receives the error
          }
        },
      });
    },
  },
});
