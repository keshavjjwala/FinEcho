import { BACKEND_URL } from '@/lib/api';

export interface ClientFromApi {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export async function getClients(): Promise<ClientFromApi[]> {
  const res = await fetch(`${BACKEND_URL}/api/clients`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch clients");
  }
  return res.json();
}
