import EditProjectClient from '@/components/EditProjectClient';

// Same split as the note edit page: this stays a (server) module so it
// can read the dynamic `:id` the normal Next.js way, and the client-only
// logic (fetching with the auth cookie, the form) lives in
// EditProjectClient, which receives the id as a plain prop.
export const instant = false;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditProjectClient id={id} />;
}
