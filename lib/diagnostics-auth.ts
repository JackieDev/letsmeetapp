import { auth } from "@clerk/nextjs/server";
import { getClerkUserDetails } from "@/lib/clerk-user";

const ADMIN_EMAIL = "jacqueline@letsmeet.uk";

export async function isDiagnosticsAuthorized(request: Request): Promise<boolean> {
  const secret = process.env.DB_DIAGNOSTIC_SECRET?.trim();
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${secret}`) {
      return true;
    }
    if (request.headers.get("x-diagnostic-secret") === secret) {
      return true;
    }
  }

  const { userId } = await auth();
  if (!userId) {
    return false;
  }

  const details = await getClerkUserDetails(userId);
  return details.email === ADMIN_EMAIL;
}
