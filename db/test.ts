import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { usersTable } from './schema';

async function main() {
  console.log('Starting database test...\n');

  // Create a new user
  const user: typeof usersTable.$inferInsert = {
    name: 'John',
    age: 30,
    email: 'john@example.com',
  };

  await db.insert(usersTable).values(user);
  console.log('✓ New user created!');

  // Get all users
  const users = await db.select().from(usersTable);
  console.log('✓ Getting all users from the database:', users);

  // Update user
  await db
    .update(usersTable)
    .set({
      age: 31,
    })
    .where(eq(usersTable.email, user.email));
  console.log('✓ User info updated!');

  // Get updated user
  const updatedUsers = await db.select().from(usersTable);
  console.log('✓ Updated users:', updatedUsers);

  // Delete user
  await db.delete(usersTable).where(eq(usersTable.email, user.email));
  console.log('✓ User deleted!');

  console.log('\n✓ Database test completed successfully!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
