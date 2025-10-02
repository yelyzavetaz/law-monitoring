export type Bill = {
  id: number;
  rada_id: string;
  title: string;
  url: string;
  status: string | null;
  sector: "SOCIAL" | "AGRI" | "CORPORATE" | null;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  risk_score: number;
  tags: string[];
  updated_at: string;
  created_at?: string;
  number?: string | null;
  law_title?: string | null;
  registered_at?: string | null;
};

export type BillVersion = {
  id: number;
  fetched_at: string;
  diff_from_prev: string | null;
  content_preview: string | null;
};
