import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

type DbInstance = ReturnType<typeof drizzle>;

let dbInstance: DbInstance | undefined;

function getDbInstance(): DbInstance {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Use .env.production, host env, or AWS Secrets Manager (see instrumentation and .env.production.example)."
      );
    }
    dbInstance = drizzle({ client: neon(url) });
  }
  return dbInstance;
}

/**
 * Lazily connects after env is ready (e.g. AWS secrets applied in `instrumentation.ts`).
 */
export const db = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    const inst = getDbInstance();
    const value = Reflect.get(inst as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(inst);
    }
    return value;
  },
});
