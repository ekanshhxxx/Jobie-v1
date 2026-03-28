import mongoose from "mongoose";
import Profile from "../models/Profile";
import User from "../models/User";
import MongoProfile from "../models/mongo/Profile";
import MongoUser from "../models/mongo/User";

const isMongoReady = () => mongoose.connection.readyState === 1;

const calculateProfileCompleteness = (data: Record<string, any>): number => {
  let score = 0;
  if (data.bio) score += 10;
  if (data.headline) score += 5;
  if (data.location) score += 5;
  if (data.phone) score += 5;
  if (data.website) score += 5;
  if (data.linkedin) score += 5;
  if (data.avatarUrl) score += 5;
  if (data.resumeUrl) score += 5;
  if (Array.isArray(data.skills) && data.skills.length > 0) score += 20;
  if (Array.isArray(data.experience) && data.experience.length > 0) score += 20;
  if (Array.isArray(data.education) && data.education.length > 0) score += 15;
  if (Array.isArray(data.projects) && data.projects.length > 0) score += 20;
  if (data.githubUsername) score += 10;
  if (Array.isArray(data.githubVerifiedSkills) && data.githubVerifiedSkills.length > 0) score += 5;
  return Math.min(score, 100);
};

export const getProfileWithFallback = async (userId: number) => {
  try {
    const profile = await Profile.findOne({ where: { userId } });
    if (profile) {
      syncProfileToMongo(profile.get({ plain: true })).catch(() => {});
      return { source: "mysql", data: profile.get({ plain: true }) };
    }
    return { source: "mysql", data: null };
  } catch (err) {
    console.error(`MySQL read failed for user ${userId}. Falling back to MongoDB.`);
    if (!isMongoReady()) return { source: "mongo", data: null };
    const mongoProfile = await MongoProfile.findOne({ userId });
    return { source: "mongo", data: mongoProfile ? mongoProfile.toObject() : null };
  }
};

export const getUserWithFallback = async (userId: number) => {
  try {
    const user = await User.findByPk(userId);
    if (user) {
      syncUserToMongo(user.get({ plain: true })).catch(() => {});
      return { source: "mysql", data: user.get({ plain: true }) };
    }
    return { source: "mysql", data: null };
  } catch (err) {
    console.error(`MySQL user read failed for user ${userId}. Falling back to MongoDB.`);
    if (!isMongoReady()) return { source: "mongo", data: null };
    const mongoUser = await MongoUser.findOne({ sqlId: userId });
    return { source: "mongo", data: mongoUser ? mongoUser.toObject() : null };
  }
};

/**
 * Find a user by any field (firebaseUid, email, githubUid) with MySQL→MongoDB fallback.
 */
export const findUserByField = async (field: Record<string, string>): Promise<Record<string, any> | null> => {
  // MySQL first
  try {
    const user = await User.findOne({ where: field });
    if (user) {
      syncUserToMongo(user.get({ plain: true })).catch(() => {});
      return user.get({ plain: true });
    }
    return null;
  } catch (err) {
    const key = Object.keys(field)[0];
    const val = Object.values(field)[0];
    console.warn(`MySQL unavailable — falling back to MongoDB for ${key}=${val}`);
    if (!isMongoReady()) return null;
    const mongoUser = await MongoUser.findOne(field);
    return mongoUser ? mongoUser.toObject() : null;
  }
};

/**
 * Update or create a user row with MySQL→MongoDB fallback.
 * Returns the user plain object from whichever DB succeeded.
 */
export const upsertUserWithFallback = async (
  where: Record<string, any>,
  defaults: Record<string, any>
): Promise<Record<string, any> | null> => {
  // MySQL first
  try {
    const [user, created] = await User.findOrCreate({ where, defaults });
    const plain = user.get({ plain: true });
    if (!created) {
      // Update fields in defaults onto existing row
      const updates: Record<string, any> = {};
      for (const [k, v] of Object.entries(defaults)) {
        if (v !== undefined && v !== null && (plain as Record<string, any>)[k] !== v) updates[k] = v;
      }
      if (Object.keys(updates).length > 0) await user.update(updates);
      Object.assign(plain, updates);
    }
    syncUserToMongo(plain).catch(() => {});
    return plain;
  } catch (err) {
    console.warn("MySQL write failed — falling back to MongoDB for user upsert:", (err as Error).message);
    if (!isMongoReady()) return null;
    const mongoUser = await MongoUser.findOneAndUpdate(
      where,
      { $setOnInsert: { ...where, ...defaults } },
      { upsert: true, new: true }
    );
    return mongoUser ? mongoUser.toObject() : null;
  }
};

/**
 * Update a user record with MySQL→MongoDB fallback.
 */
export const updateUserWithFallback = async (
  userId: number | null,
  match: Record<string, any>,
  updates: Record<string, any>
): Promise<boolean> => {
  let ok = false;
  try {
    const user = userId
      ? await User.findByPk(userId)
      : await User.findOne({ where: match });
    if (user) {
      await user.update(updates);
      syncUserToMongo({ ...user.get({ plain: true }), ...updates }).catch(() => {});
      ok = true;
    }
  } catch {
    console.warn("MySQL user update failed, trying MongoDB.");
  }
  if (!ok && isMongoReady()) {
    const query = userId ? { sqlId: userId } : match;
    await MongoUser.findOneAndUpdate(query, { $set: updates }).catch(() => {});
    ok = true;
  }
  return ok;
};

export const saveProfileDual = async (userId: number, data: any) => {
  let mysqlResult = null;
  let mongoResult = null;

  try {
    const profile = await Profile.findOne({ where: { userId } });
    const baseProfile = profile ? profile.get({ plain: true }) : {};
    const mergedProfile = { ...baseProfile, ...data };
    const payload = {
      ...data,
      profileCompleteness: calculateProfileCompleteness(mergedProfile),
    };

    if (profile) {
      mysqlResult = await profile.update(payload);
    } else {
      mysqlResult = await Profile.create({ userId, ...payload });
    }
  } catch (err: any) {
    console.error(`MySQL write failed for user ${userId}:`, err?.message || err);
  }

  if (isMongoReady()) {
    try {
      const baseMongo = mysqlResult ? (mysqlResult as any).get?.({ plain: true }) || {} : {};
      const mergedProfile = { ...baseMongo, ...data };
      const payload = {
        ...data,
        profileCompleteness: calculateProfileCompleteness(mergedProfile),
      };

      mongoResult = await MongoProfile.findOneAndUpdate(
        { userId },
        { $set: payload },
        { upsert: true, new: true }
      );
    } catch (err: any) {
      console.error(`MongoDB write failed for user ${userId}:`, err?.message || err);
    }
  }

  return { mysqlResult, mongoResult };
};

export const syncUserToMongo = async (userData: any) => {
  if (!isMongoReady()) return;
  try {
    await MongoUser.findOneAndUpdate(
      { sqlId: userData.id },
      {
        $set: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          firebaseUid: userData.firebaseUid,
          githubUid: userData.githubUid,
          banned: userData.banned,
        },
      },
      { upsert: true }
    );
  } catch (err: any) {
    console.error("Sync to Mongo user failed:", err?.message || err);
  }
};

export const syncProfileToMongo = async (profileData: any) => {
  if (!isMongoReady()) return;
  try {
    const payload = {
      ...profileData,
      profileCompleteness: calculateProfileCompleteness(profileData),
    };
    await MongoProfile.findOneAndUpdate(
      { userId: profileData.userId },
      { $set: payload },
      { upsert: true }
    );
  } catch (err: any) {
    console.error("Sync to Mongo profile failed:", err?.message || err);
  }
};
