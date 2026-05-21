import bcrypt from "bcryptjs";
import User from "../models/User";

const admins: {
  name: string;
  email: string;
  password: string;
  role: "admin";
}[] = [
  {
    name: "Admin One",
    email: "admin1@gmail.com",
    password: "pass123",
    role: "admin",
  },
  {
    name: "Admin Two",
    email: "admin2@gmail.com",
    password: "pass123",
    role: "admin",
  },
  {
    name: "Admin Three",
    email: "admin3@gmail.com",
    password: "pass123",
    role: "admin",
  },
  {
    name: "Admin Four",
    email: "admin4@gmail.com",
    password: "pass123",
    role: "admin",
  },
];

const seedAdmins = async () => {
  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const existing = await User.findOne({
      where: { email: admin.email },
    });

    if (existing) {
      await existing.update({
        name: admin.name,
        password: hashedPassword,
        role: admin.role,
      });

      console.log(`🔄 Updated admin: ${admin.email}`);
    } else {
      await User.create({
        ...admin,
        password: hashedPassword,
      });

      console.log(`✅ Created admin: ${admin.email}`);
    }
  }

  console.log("🎉 Admin seeding completed!");
};

seedAdmins()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error seeding admins:", err);
    process.exit(1);
  });