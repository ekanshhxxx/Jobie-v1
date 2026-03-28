import sequelize from "../config/database";
import User from "../models/User";
import bcrypt from "bcryptjs";

async function forceAdminSeed() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    const email = "admin@jobie.app";
    const password = "adminpassword123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: "Super Admin",
        email,
        password: hashedPassword,
        role: "admin",
      },
    });

    if (created) {
      console.log(`[SUCCESS] Admin user created: ${email} / ${password}`);
    } else {
      user.set({
        password: hashedPassword,
        role: "admin",
      });
      await user.save();
      console.log(`[SUCCESS] Existing user ${email} upgraded to Admin with password Reset.`);
    }
  } catch (error) {
    console.error("[ERROR] Failed to seed admin:", error);
  } finally {
    process.exit(0);
  }
}

forceAdminSeed();
