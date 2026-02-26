import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "Id" SERIAL PRIMARY KEY,
        "Uid" VARCHAR(50) NOT NULL UNIQUE,
        "Password" VARCHAR(255) NOT NULL,
        "Name" VARCHAR(100),
        "Email" VARCHAR(100)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "TimesheetEntries" (
        "Id" SERIAL PRIMARY KEY,
        "UserId" INTEGER NOT NULL,
        "Date" DATE NOT NULL,
        "Project" VARCHAR(100) NOT NULL,
        "Task" VARCHAR(200) NOT NULL,
        "Hours" DECIMAL(5,2) NOT NULL,
        "Description" TEXT,
        FOREIGN KEY ("UserId") REFERENCES "Users"("Id")
      )
    `);

    await pool.query(`
      INSERT INTO "Users" ("Uid", "Password", "Name", "Email") 
      VALUES ('admin', 'admin123', 'Admin User', 'admin@example.com')
      ON CONFLICT ("Uid") DO NOTHING
    `);

    return Response.json({ message: 'Database initialized successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
