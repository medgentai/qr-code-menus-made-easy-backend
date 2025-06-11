import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // Higher salt rounds for admin security
  return bcrypt.hash(password, salt);
}

async function createAdminUser() {
  console.log('🔐 Creating Admin User...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@scanserve.com' },
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log('📧 Email: admin@scanserve.com');
      console.log('🔑 Password: Admin123!');
      console.log('👤 Role: ADMIN');
      return;
    }

    // Hash the admin password
    const hashedPassword = await hashPassword('Admin123!');

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@scanserve.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@scanserve.com');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role: ADMIN');
    console.log(`🆔 User ID: ${adminUser.id}`);
    
    // Create a second admin user for testing
    const secondAdminPassword = await hashPassword('SuperAdmin123!');
    const secondAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@scanserve.com',
        name: 'Super Administrator',
        password: secondAdminPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: null,
      },
    });

    console.log('✅ Second admin user created successfully!');
    console.log('📧 Email: superadmin@scanserve.com');
    console.log('🔑 Password: SuperAdmin123!');
    console.log('👤 Role: ADMIN');
    console.log(`🆔 User ID: ${secondAdmin.id}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function createTestUsers() {
  console.log('👥 Creating Test Users...');
  
  try {
    // Create test regular user
    const testUserPassword = await hashPassword('TestUser123!');
    
    const existingTestUser = await prisma.user.findUnique({
      where: { email: 'testuser@scanserve.com' },
    });

    if (!existingTestUser) {
      const testUser = await prisma.user.create({
        data: {
          email: 'testuser@scanserve.com',
          name: 'Test User',
          password: testUserPassword,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          phoneNumber: '+91-9876543210',
        },
      });

      console.log('✅ Test user created successfully!');
      console.log('📧 Email: testuser@scanserve.com');
      console.log('🔑 Password: TestUser123!');
      console.log('👤 Role: USER');
      console.log(`🆔 User ID: ${testUser.id}`);
    } else {
      console.log('ℹ️  Test user already exists');
    }

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

async function main() {
  console.log('🌱 Starting Admin Seed Process...');
  console.log('=====================================');
  
  try {
    await createAdminUser();
    console.log('');
    await createTestUsers();
    
    console.log('');
    console.log('=====================================');
    console.log('✅ Admin seed completed successfully!');
    console.log('');
    console.log('🚀 How to Login:');
    console.log('1. Start the application:');
    console.log('   Backend: cd backend && npm run start:dev');
    console.log('   Frontend: cd frontend && npm run dev');
    console.log('');
    console.log('2. Navigate to: http://localhost:5173/login');
    console.log('');
    console.log('3. Admin Login Credentials:');
    console.log('   📧 Email: admin@scanserve.com');
    console.log('   🔑 Password: Admin123!');
    console.log('');
    console.log('4. Alternative Admin Login:');
    console.log('   📧 Email: superadmin@scanserve.com');
    console.log('   🔑 Password: SuperAdmin123!');
    console.log('');
    console.log('5. Test User Login:');
    console.log('   📧 Email: testuser@scanserve.com');
    console.log('   🔑 Password: TestUser123!');
    console.log('');
    console.log('6. Access Admin Panel:');
    console.log('   After login as admin, go to: http://localhost:5173/admin');
    console.log('');
    console.log('🔐 Security Notes:');
    console.log('- Passwords are properly hashed with bcrypt');
    console.log('- Admin users have elevated privileges');
    console.log('- Change default passwords in production');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Admin seed failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('🎉 Admin seed process completed');
  })
  .catch((error) => {
    console.error('💥 Fatal error in admin seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });
