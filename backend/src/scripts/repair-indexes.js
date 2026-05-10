/* eslint-disable no-console */
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const TARGETS = [
  { table: "users", column: "email", canonical: "ux_users_email" },
  { table: "users", column: "firebaseUid", canonical: "ux_users_firebase_uid" },
  { table: "users", column: "githubUid", canonical: "ux_users_github_uid" },
  { table: "profiles", column: "userId", canonical: "ux_profiles_user_id" },
];

async function findDuplicateIndexes(conn, target) {
  const [rows] = await conn.query(
    `SELECT DISTINCT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
        AND NON_UNIQUE = 0
        AND INDEX_NAME NOT IN ('PRIMARY', ?)`,
    [target.table, target.column, target.canonical]
  );
  return rows.map((r) => r.INDEX_NAME);
}

async function canonicalExists(conn, target) {
  const [rows] = await conn.query(
    `SELECT 1
       FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1`,
    [target.table, target.canonical]
  );
  return rows.length > 0;
}

async function run({ execute }) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "jobie",
  });

  try {
    for (const target of TARGETS) {
      const duplicates = await findDuplicateIndexes(conn, target);
      console.log(`\n${target.table}.${target.column}`);
      console.log(`Duplicate indexes: ${duplicates.length ? duplicates.join(", ") : "none"}`);

      if (!execute) continue;

      for (const idx of duplicates) {
        await conn.query(`ALTER TABLE \`${target.table}\` DROP INDEX \`${idx}\``);
        console.log(`Dropped: ${idx}`);
      }

      const hasCanonical = await canonicalExists(conn, target);
      if (!hasCanonical) {
        await conn.query(
          `CREATE UNIQUE INDEX \`${target.canonical}\` ON \`${target.table}\` (\`${target.column}\`)`
        );
        console.log(`Created canonical index: ${target.canonical}`);
      }
    }

    console.log(`\n${execute ? "Repair completed." : "Dry-run complete (no changes)."}`);
  } finally {
    await conn.end();
  }
}

const execute = process.argv.includes("--execute");
run({ execute }).catch((err) => {
  console.error("repair-indexes failed:", err);
  process.exit(1);
});
