export const fetchJSON = async <T>(url: string): Promise<T> => {
  const base =
    "https://yelyzavetaz.website/projects/law-monitoring/api"; // dev
  const res = await fetch(`${base}${url}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};
