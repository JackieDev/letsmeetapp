import "dotenv/config";
import {
  insertGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroupById,
} from "./queries/groups";

async function main() {
  console.log("Starting database test...\n");

  const ownerId = "test-owner-id";

  // Create a new group
  const created = await insertGroup({
    name: "Test Group",
    description: "A test group",
    city: "London",
    ownerId,
  });
  console.log("✓ New group created!", created);

  // Get all groups
  const groups = await getGroups();
  console.log("✓ Getting all groups from the database:", groups);

  // Update group
  await updateGroup(created.id, {
    description: "Updated description",
  });
  console.log("✓ Group info updated!");

  // Get updated group
  const updated = await getGroup(created.id);
  console.log("✓ Updated group:", updated);

  // Delete group
  await deleteGroupById(created.id);
  console.log("✓ Group deleted!");

  console.log("\n✓ Database test completed successfully!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
