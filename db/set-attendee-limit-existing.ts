import "dotenv/config";
import { setAttendeeLimitWhereNull } from "./queries/events";

async function main() {
  const limit = 20;
  const updated = await setAttendeeLimitWhereNull(limit);
  console.log(`Set attendeeLimit to ${limit} for ${updated} existing event(s).`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
