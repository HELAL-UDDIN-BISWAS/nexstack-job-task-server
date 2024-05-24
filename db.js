const dotenv = require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: 5432,
});

pool.connect((err) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to the database');
  }
});

module.exports = pool;

// CREATE DATABASE "UserAuthentication"
//     WITH
//     OWNER = postgres
//     ENCODING = 'UTF8'
//     LOCALE_PROVIDER = 'libc'
//     CONNECTION LIMIT = -1
//     IS_TEMPLATE = False;