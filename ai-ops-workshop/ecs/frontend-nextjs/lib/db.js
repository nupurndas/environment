import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tmsadmin:TmsAdmin123!@tms-postgres-db.cze6gimmssrl.us-west-2.rds.amazonaws.com:5432/tmsdb',
  ssl: false
});

export default pool;
