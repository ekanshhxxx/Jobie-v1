import sequelize from "./src/config/database";
import User from "./src/models/User";

async function listUsers() {
  await sequelize.sync();
  const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

listUsers();
