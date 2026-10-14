import EditNoteClient from '@/components/EditNoteClient';

// This page itself stays a (server) module so it can read the dynamic
// `:id` the normal Next.js way, same as the public [slug] pages — the
// client-only logic (fetching with the auth cookie, the form) lives in
// EditNoteClient, which receives the id as a plain prop instead of
// calling the useParams() client hook directly.
export const instant = false;

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditNoteClient id={id} />;
}
