/* eslint-disable no-console */
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT 1
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function deleteByUserId(conn, tableName, colName, userIds) {
  if (!userIds.length) return 0;
  if (!(await tableExists(conn, tableName))) return 0;
  const [res] = await conn.query(
    `DELETE FROM \`${tableName}\` WHERE \`${colName}\` IN (${userIds.map(() => "?").join(",")})`,
    userIds
  );
  return res.affectedRows || 0;
}

async function run({ execute }) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "jobie",
  });

  try {
    const [targets] = await conn.query(
      `SELECT id, name, email, role
         FROM users
        WHERE LOWER(TRIM(email)) LIKE '%@test.com'
        ORDER BY id`
    );

    if (!targets.length) {
      console.log("No synthetic @test.com users found.");
      return;
    }

    const userIds = targets.map((u) => Number(u.id));
    console.log(`Found ${targets.length} synthetic users.`);
    console.table(targets);

    if (!execute) {
      console.log("DRY-RUN only. Re-run with --execute to delete.");
      return;
    }

    await conn.beginTransaction();
    try {
      const deleted = {};
      deleted.applications = await deleteByUserId(conn, "applications", "userId", userIds);
      deleted.jobs = await deleteByUserId(conn, "jobs", "recruiterId", userIds);
      deleted.profiles = await deleteByUserId(conn, "profiles", "userId", userIds);
      deleted.atschecks = await deleteByUserId(conn, "atschecks", "userId", userIds);
      deleted.ats_roadmaps = await deleteByUserId(conn, "ats_roadmaps", "userId", userIds);
      deleted.meetingsCandidate = await deleteByUserId(conn, "meetings", "candidateId", userIds);
      deleted.meetingsRecruiter = await deleteByUserId(conn, "meetings", "recruiterId", userIds);

      const [usersDel] = await conn.query(
        `DELETE FROM users WHERE id IN (${userIds.map(() => "?").join(",")})`,
        userIds
      );
      deleted.users = usersDel.affectedRows || 0;

      await conn.commit();
      console.log("Cleanup committed.");
      console.table(deleted);
    } catch (err) {
      await conn.rollback();
      console.error("Cleanup rolled back due to error:", err.message);
      throw err;
    }
  } finally {
    await conn.end();
  }
}

const execute = process.argv.includes("--execute");
run({ execute })
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
