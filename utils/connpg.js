require("dotenv").config()
const { Pool } = require("pg")

const config = {
  host: process.env.PDB_HOST,
  user: process.env.PDB_USER,
  password: process.env.PDB_PASS,
  database: process.env.PDB_NAME,
  port: process.env.PDB_PORT,
}

const pool = new Pool(config)

module.exports = pool