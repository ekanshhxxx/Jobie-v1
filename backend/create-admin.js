// Script to create default admin user
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'jobie',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
  }
);

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('candidate', 'recruiter', 'admin'), 
    defaultValue: 'candidate',
    allowNull: false 
  },
}, {
  tableName: 'Users',
  timestamps: true,
});

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@jobie.app' } });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log('   Email: admin@jobie.app');
      console.log('   Role:', existingAdmin.role);
      
      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      }
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('adminpassword123', 10);
      
      const admin = await User.create({
        name: 'Administrator',
        email: 'admin@jobie.app',
        password: hashedPassword,
        role: 'admin',
      });

      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@jobie.app');
      console.log('   Password: adminpassword123');
      console.log('   Role: admin');
    }

    console.log('\n🔐 Secret Admin Access:');
    console.log('   Press: Ctrl+Shift+A (or Cmd+Shift+A on Mac)');
    console.log('   From: Any page in the app');
    console.log('\n📝 Or login normally at: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();
