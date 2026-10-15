const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Project = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  source: 'manual' | 'github';
  status: 'draft' | 'published';
  pinned: boolean;
  image_url: string | null;
  github_pushed_at: string | null;
};

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_URL}/projects`);
  const data = await res.json();
  return data.projects;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const res = await fetch(`${API_URL}/projects/${slug}`);
  if (res.status === 404) return null;
  const data = await res.json();
  return data.project;
}

export type Note = {
  id: number;
  title: string;
  slug: string;
  category: 'ai-ml' | 'backend' | 'infrastructure' | 'ios' | 'dsa';
  content: string;
  project_id: number | null;
  status: 'draft' | 'published';
  pinned: boolean;
  image_url: string | null;
};

export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${API_URL}/notes`);
  const data = await res.json();
  return data.notes;
}

export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const res = await fetch(`${API_URL}/notes/${slug}`);
  if (res.status === 404) return null;
  const data = await res.json();
  return data.note;
}
