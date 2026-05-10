const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize('jobie', 'root', 'Amrit16947', {
  host: '127.0.0.1',
  dialect: 'mysql'
});

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.ENUM('candidate', 'recruiter', 'admin'), defaultValue: 'candidate' }
}, { tableName: 'Users' });

async function run() {
  try {
    const email = 'admin@jobie.app';
    const password = 'adminpassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await sequelize.authenticate();
    console.log('Database connected.');
    
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'admin'
      }
    });

    if (created) {
      console.log('Created admin@jobie.app / adminpassword123');
    } else {
      user.password = hashedPassword;
      user.role = 'admin';
      await user.save();
      console.log('Updated admin@jobie.app / adminpassword123');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
