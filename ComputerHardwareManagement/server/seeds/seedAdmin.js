import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import { User, Role, sequelize } from '../models/index.js';

dotenv.config();

/**
 * Seed initial Admin user safely without plain-text passwords
 */
const seedAdmin = async () => {
  try {
    await connectDB();

    // 1. Ensure Roles exist
    let adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'ADMIN',
        description: 'Consumable Stock Administrator with full CRUD privileges'
      });
      console.log('✅ Created ADMIN role.');
    }

    let facultyRole = await Role.findOne({ where: { name: 'FACULTY' } });
    if (!facultyRole) {
      facultyRole = await Role.create({
        name: 'FACULTY',
        description: 'Academic Faculty with Catalog browsing and Indent requisition privileges'
      });
      console.log('✅ Created FACULTY role.');
    }

    // 2. Check if an Admin user already exists
    const existingAdmin = await User.findOne({
      where: { role_id: adminRole.id }
    });

    if (existingAdmin) {
      console.log(`ℹ️ Admin account already exists (ID: ${existingAdmin.id}, username: "${existingAdmin.username}"). No action needed.`);
      return;
    }

    // 3. Create initial Admin with bcrypt hashed password
    const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@nec.edu.in';
    const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newAdmin = await User.create({
      username: adminUsername.toLowerCase().trim(),
      password: hashedPassword,
      name: 'System Administrator',
      email: adminEmail.toLowerCase().trim(),
      role_id: adminRole.id,
      department_id: null,
      avatar_text: 'A',
      active: true
    });

    console.log(`✅ Initial Admin successfully seeded! (ID: ${newAdmin.id}, username: "${newAdmin.username}", email: "${newAdmin.email}")`);
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seedAdmin();
