import { redirect } from "next/navigation";

export default async function GroupsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; city?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (typeof params.name === "string" && params.name.trim()) {
    query.set("name", params.name);
  }
  if (typeof params.city === "string" && params.city.trim()) {
    query.set("city", params.city);
  }
  const target = query.size > 0 ? `/groups?${query.toString()}` : "/groups";
  redirect(target);
}
