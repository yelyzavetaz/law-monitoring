export const fetchJSON = async <T,>(url: string): Promise<T> => {
  const base = "http://localhost:3000"; // dev
  const res = await fetch(`${base}${url}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};
