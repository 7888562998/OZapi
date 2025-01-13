import  Pool  from 'pg';

export const pool = new Pool.Pool({
  user: 'postgres', // replace with your PostgreSQL username
  host: '192.168.1.5', // replace with your PostgreSQL server
  database: 'OZ', // replace with your database name
  password: 'password', // replace with your PostgreSQL password
  port: 5000, // default PostgreSQL port
});
