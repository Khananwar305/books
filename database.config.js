/**
 * Database Configuration for Viti Books
 *
 * Switch between SQLite and MariaDB by changing the DATABASE_TYPE environment variable
 * or by modifying the config below.
 */

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'mariadb'; // 'sqlite' or 'mariadb'

const configs = {
  sqlite: {
    type: 'sqlite',
    // filename will be set by the application based on user selection
  },
  mariadb: {
    type: 'mariadb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vitibooks',
  }
};

module.exports = {
  DATABASE_TYPE,
  getDatabaseConfig: (type = DATABASE_TYPE) => configs[type],
  configs
};