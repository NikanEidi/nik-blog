'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Admin = { id: number; email: string };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch(`${API_URL}/admin/me`, { credentials: 'include' });

      if (!res.ok) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      setAdmin(data.admin);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return <main>Loading...</main>;
  }

  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>Logged in as {admin?.email}</p>
    </main>
  );
}
