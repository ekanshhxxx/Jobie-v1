import sequelize from "../config/database";
import User from "../models/User";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");
    
    const adminEmail = "admin@jobie.app";
    const hashedPassword = await bcrypt.hash("adminpassword123", 10);
    
    const [user, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      }
    });

    if (created) {
      console.log("Admin user created: admin@jobie.app / adminpassword123");
    } else {
      // Ensure the existing user is an admin
      user.set({ role: "admin", password: hashedPassword });
      await user.save();
      console.log("Admin user updated: admin@jobie.app / adminpassword123");
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
