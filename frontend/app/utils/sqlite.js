import * as SQLite from 'expo-sqlite';

// Open database using the new API
const db = SQLite.openDatabaseSync('app.db');

// Database initialization
export const initDatabase = async () => {
  try {
    // Create table if not exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY NOT NULL, 
        value TEXT
      );
    `);
    
    console.log('Database initialized successfully');
    
    // Set default Odoo configuration if not exists
    const existingUrl = await dbOperations.getConfig('odoo_url');
    const existingDb = await dbOperations.getConfig('odoo_db');
    
    /*if (!existingUrl) {
      await dbOperations.setConfig('odoo_url', 'https://daisy-consulting-smilepiscine-staging-20683340.dev.odoo.com');
    }
    if (!existingDb) {
      await dbOperations.setConfig('odoo_db', 'daisy-consulting-smilepiscine-staging-20683340');
    }
    */
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Database operations
export const dbOperations = {
  setConfig: async (key, value) => {
    try {
      await db.runAsync(
        'REPLACE INTO config (key, value) VALUES (?, ?);',
        [key, value]
      );
      console.log(`Saved ${key}:`, value);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  },

  getConfig: async (key) => {
    try {
      const result = await db.getFirstAsync(
        'SELECT value FROM config WHERE key = ?;',
        [key]
      );
      return result ? result.value : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      throw error;
    }
  },

  clearConfig: async () => {
    try {
      await db.runAsync('DELETE FROM config;');
      console.log('Config cleared');
    } catch (error) {
      console.error('Error clearing config:', error);
      throw error;
    }
  }
};

// Default export for Expo Router compatibility
export default dbOperations;