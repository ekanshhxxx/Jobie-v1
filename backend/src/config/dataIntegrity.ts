import sequelize from "./database";
import { QueryTypes } from "sequelize";

type IndexSpec = {
  table: string;
  name: string;
  column: string;
};

const INDEXES: IndexSpec[] = [
  { table: "users", name: "ux_users_email", column: "email" },
  { table: "users", name: "ux_users_firebase_uid", column: "firebaseUid" },
  { table: "users", name: "ux_users_github_uid", column: "githubUid" },
  { table: "profiles", name: "ux_profiles_user_id", column: "userId" },
];

export const ensureDataIntegrityIndexes = async () => {
  for (const spec of INDEXES) {
    const duplicateIndexes = await sequelize.query<{ INDEX_NAME: string }>(
      `SELECT DISTINCT INDEX_NAME
         FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table
          AND COLUMN_NAME = :column
          AND NON_UNIQUE = 0
          AND INDEX_NAME NOT IN ('PRIMARY', :canonicalName)`,
      {
        replacements: {
          table: spec.table,
          column: spec.column,
          canonicalName: spec.name,
        },
        type: QueryTypes.SELECT,
      }
    );

    for (const row of duplicateIndexes) {
      try {
        await sequelize.query(
          `ALTER TABLE \`${spec.table}\` DROP INDEX \`${row.INDEX_NAME}\``
        );
        console.log(`Dropped duplicate index ${row.INDEX_NAME} on ${spec.table}.${spec.column}`);
      } catch {
        console.warn(`Could not drop duplicate index ${row.INDEX_NAME}; leaving as-is for now.`);
      }
    }

    const [rows] = await sequelize.query(
      `SELECT 1
         FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table
          AND INDEX_NAME = :name
        LIMIT 1`,
      { replacements: { table: spec.table, name: spec.name } }
    );

    const exists = Array.isArray(rows) && rows.length > 0;
    if (exists) continue;

    try {
      await sequelize.query(
        `CREATE UNIQUE INDEX \`${spec.name}\` ON \`${spec.table}\` (\`${spec.column}\`)`
      );
      console.log(`Created index ${spec.name}`);
    } catch (error) {
      console.warn(
        `Could not create index ${spec.name}. Resolve duplicates first, then retry.`
      );
    }
  }
};
