const dotenv = require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.External_Database_URL,
  ssl:{
    rejectUnauthorized:false
  }
});


const createTables = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
  );
 `);
  } 
  catch (err) {
    console.log(err);

  }

  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      author VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      image TEXT
  );
   `);
  } catch (err) {
    console.log(err);
  }
};

createTables();

pool.connect((err) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to the database');
  }
});

module.exports = pool;
