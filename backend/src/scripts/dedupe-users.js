/* eslint-disable no-console */
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const roleRank = { candidate: 1, recruiter: 2, admin: 3 };

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parseJsonMaybe(value, fallback) {
  if (value == null) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function uniqStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const item of arr || []) {
    const val = String(item || "").trim();
    if (!val) continue;
    const key = val.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(val);
  }
  return out;
}

function pickCanonical(group) {
  const scored = group.map((u) => {
    let score = 0;
    if (u.role === "admin") score += 100;
    if (u.role === "recruiter") score += 40;
    if (u.firebaseUid) score += 30;
    if (u.githubUid) score += 20;
    if (u.password) score += 15;
    if (u.profileExists) score += 10;
    score += Math.min(10, u.applicationsCount || 0);
    score += Math.min(10, u.jobsCount || 0);
    return { ...u, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id - b.id;
  });
  return scored[0];
}

async function getTableColumns(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return new Set(rows.map((r) => r.COLUMN_NAME));
}

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

async function mergeProfiles(conn, canonicalId, duplicateId, txConn) {
  const [rows] = await txConn.query(
    "SELECT * FROM profiles WHERE userId IN (?, ?) ORDER BY userId",
    [canonicalId, duplicateId]
  );
  const canonicalProfile = rows.find((r) => Number(r.userId) === Number(canonicalId)) || null;
  const duplicateProfile = rows.find((r) => Number(r.userId) === Number(duplicateId)) || null;

  if (!duplicateProfile) return;
  if (!canonicalProfile) {
    await txConn.query("UPDATE profiles SET userId = ? WHERE userId = ?", [canonicalId, duplicateId]);
    return;
  }

  const merged = { ...canonicalProfile };
  const scalarFields = [
    "bio",
    "headline",
    "location",
    "phone",
    "website",
    "linkedin",
    "birthday",
    "gender",
    "avatarUrl",
    "companyName",
    "companyLogo",
    "resumeUrl",
    "githubUsername",
  ];
  for (const f of scalarFields) {
    if ((!merged[f] || String(merged[f]).trim() === "") && duplicateProfile[f]) {
      merged[f] = duplicateProfile[f];
    }
  }

  const arrayFields = ["skills", "experience", "education", "projects", "githubVerifiedSkills"];
  for (const f of arrayFields) {
    const left = parseJsonMaybe(canonicalProfile[f], []);
    const right = parseJsonMaybe(duplicateProfile[f], []);
    if (f === "skills" || f === "githubVerifiedSkills") {
      merged[f] = JSON.stringify(uniqStrings([...(left || []), ...(right || [])]));
    } else {
      merged[f] = JSON.stringify([...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])]);
    }
  }

  if (!merged.githubDeepScan && duplicateProfile.githubDeepScan) merged.githubDeepScan = duplicateProfile.githubDeepScan;
  if (!merged.resumeReport && duplicateProfile.resumeReport) merged.resumeReport = duplicateProfile.resumeReport;

  const completeness = Number(merged.profileCompleteness || 0);
  const duplicateCompleteness = Number(duplicateProfile.profileCompleteness || 0);
  merged.profileCompleteness = Math.max(completeness, duplicateCompleteness);

  await txConn.query(
    `UPDATE profiles
        SET bio = ?, headline = ?, location = ?, phone = ?, website = ?, linkedin = ?, birthday = ?, gender = ?,
            avatarUrl = ?, companyName = ?, companyLogo = ?, resumeUrl = ?, skills = ?, experience = ?, education = ?,
            projects = ?, githubUsername = ?, githubVerifiedSkills = ?, githubDeepScan = ?, resumeReport = ?,
            profileCompleteness = ?, updatedAt = NOW()
      WHERE userId = ?`,
    [
      merged.bio || null,
      merged.headline || null,
      merged.location || null,
      merged.phone || null,
      merged.website || null,
      merged.linkedin || null,
      merged.birthday || null,
      merged.gender || null,
      merged.avatarUrl || null,
      merged.companyName || null,
      merged.companyLogo || null,
      merged.resumeUrl || null,
      merged.skills || JSON.stringify([]),
      merged.experience || JSON.stringify([]),
      merged.education || JSON.stringify([]),
      merged.projects || JSON.stringify([]),
      merged.githubUsername || null,
      merged.githubVerifiedSkills || JSON.stringify([]),
      merged.githubDeepScan || null,
      merged.resumeReport || null,
      merged.profileCompleteness || 0,
      canonicalId,
    ]
  );

  await txConn.query("DELETE FROM profiles WHERE userId = ?", [duplicateId]);
}

async function updateIfTableAndColumn(txConn, tableName, columnName, canonicalId, duplicateId) {
  const exists = await tableExists(txConn, tableName);
  if (!exists) return;
  const cols = await getTableColumns(txConn, tableName);
  if (!cols.has(columnName)) return;
  await txConn.query(`UPDATE \`${tableName}\` SET \`${columnName}\` = ? WHERE \`${columnName}\` = ?`, [canonicalId, duplicateId]);
}

async function run({ execute }) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "jobie",
    multipleStatements: false,
  });

  try {
    const [duplicates] = await conn.query(
      `SELECT LOWER(TRIM(email)) AS normalizedEmail,
              COUNT(*) AS total,
              GROUP_CONCAT(id ORDER BY id) AS ids
         FROM users
        GROUP BY LOWER(TRIM(email))
       HAVING COUNT(*) > 1`
    );

    if (!duplicates.length) {
      console.log("No duplicate emails found.");
      return;
    }

    console.log(`Found ${duplicates.length} duplicate email group(s).\n`);

    for (const d of duplicates) {
      const ids = String(d.ids)
        .split(",")
        .map((x) => Number(x.trim()))
        .filter(Boolean);
      const [users] = await conn.query(
        `SELECT u.*,
                EXISTS(SELECT 1 FROM profiles p WHERE p.userId = u.id) AS profileExists,
                (SELECT COUNT(*) FROM applications a WHERE a.userId = u.id) AS applicationsCount,
                (SELECT COUNT(*) FROM jobs j WHERE j.recruiterId = u.id) AS jobsCount
           FROM users u
          WHERE u.id IN (${ids.map(() => "?").join(",")})
          ORDER BY u.id`,
        ids
      );

      const canonical = pickCanonical(users);
      const dupes = users.filter((u) => u.id !== canonical.id);

      console.log(`Email: ${d.normalizedEmail}`);
      console.log(`Canonical: #${canonical.id} (${canonical.role})`);
      console.log(`Duplicates: ${dupes.map((u) => `#${u.id}(${u.role})`).join(", ")}`);

      const uidConflicts = dupes.filter(
        (u) =>
          u.firebaseUid &&
          canonical.firebaseUid &&
          String(u.firebaseUid).trim() !== String(canonical.firebaseUid).trim()
      );
      const ghConflicts = dupes.filter(
        (u) =>
          u.githubUid &&
          canonical.githubUid &&
          String(u.githubUid).trim() !== String(canonical.githubUid).trim()
      );
      if (uidConflicts.length || ghConflicts.length) {
        console.log("SKIP: identity conflict (different firebaseUid/githubUid present).\n");
        continue;
      }

      if (!execute) {
        console.log("DRY-RUN: no rows changed.\n");
        continue;
      }

      await conn.beginTransaction();
      try {
        for (const dupe of dupes) {
          await mergeProfiles(conn, canonical.id, dupe.id, conn);
          await updateIfTableAndColumn(conn, "applications", "userId", canonical.id, dupe.id);
          await updateIfTableAndColumn(conn, "jobs", "recruiterId", canonical.id, dupe.id);
          await updateIfTableAndColumn(conn, "meetings", "candidateId", canonical.id, dupe.id);
          await updateIfTableAndColumn(conn, "meetings", "recruiterId", canonical.id, dupe.id);
          await updateIfTableAndColumn(conn, "atschecks", "userId", canonical.id, dupe.id);
          await updateIfTableAndColumn(conn, "ats_roadmaps", "userId", canonical.id, dupe.id);

          await conn.query("DELETE FROM users WHERE id = ?", [dupe.id]);
        }

        const mergedRoleRank = Math.max(
          ...users.map((u) => roleRank[u.role] || 1)
        );
        const mergedRole =
          Object.entries(roleRank).find(([, v]) => v === mergedRoleRank)?.[0] || canonical.role;

        const mergedName = canonical.name || users.find((u) => u.name)?.name || "User";
        const mergedPassword = canonical.password || users.find((u) => u.password)?.password || null;
        const mergedFirebaseUid =
          canonical.firebaseUid || users.find((u) => u.firebaseUid)?.firebaseUid || null;
        const mergedGithubUid =
          canonical.githubUid || users.find((u) => u.githubUid)?.githubUid || null;

        await conn.query(
          `UPDATE users
              SET name = ?, email = ?, password = ?, role = ?, firebaseUid = ?, githubUid = ?, updatedAt = NOW()
            WHERE id = ?`,
          [
            mergedName,
            normalizeEmail(canonical.email),
            mergedPassword,
            mergedRole,
            mergedFirebaseUid ? String(mergedFirebaseUid).trim() : null,
            mergedGithubUid ? String(mergedGithubUid).trim() : null,
            canonical.id,
          ]
        );

        await conn.commit();
        console.log("Merged successfully.\n");
      } catch (err) {
        await conn.rollback();
        console.log("ROLLBACK due to error:", err.message, "\n");
      }
    }
  } finally {
    await conn.end();
  }
}

const execute = process.argv.includes("--execute");
run({ execute })
  .then(() => {
    console.log(execute ? "DONE (execute mode)." : "DONE (dry-run mode).");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
