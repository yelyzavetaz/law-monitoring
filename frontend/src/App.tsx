import { useEffect, useMemo, useState, useCallback } from "react";
import type { Bill, BillVersion } from "./types/billTypes";
import { Chip } from "./copmponents/chip";
import { RiskBadge } from "./copmponents/riskBadge";
import { SectorBadge } from "./copmponents/sectorBadge";
import { Drawer } from "./copmponents/drawer";
import { Filters } from "./copmponents/filtersBar";
import { formatDate } from "./utils/formatDate";
import { fetchJSON } from "./utils/fetchJSON";
import { renderUnifiedDiff } from "./copmponents/unufiedDiff";

export default function App() {
  const [sector, setSector] = useState("");
  const [level, setLevel] = useState("");
  const [qStr, setQStr] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(bills.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sector) params.set("sector", sector);
      if (level) params.set("level", level);
      if (qStr) params.set("q", qStr);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const url = `/api/bills${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const data = await fetchJSON<Bill[]>(url);
      setBills(data);
      setPage(1);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    } finally {
      setLoading(false);
    }
  }, [sector, level, qStr, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, []);

  const [openId, setOpenId] = useState<number | null>(null);
  const selected = useMemo(
    () => bills.find((b) => b.id === openId) || null,
    [openId, bills]
  );
  const [versions, setVersions] = useState<BillVersion[] | null>(null);
  const [vLoading, setVLoading] = useState(false);
  const [vError, setVError] = useState<string | null>(null);

  const openDrawer = async (id: number) => {
    setOpenId(id);
    setVersions(null);
    setVError(null);
    setVLoading(true);
    try {
      const data = await fetchJSON<BillVersion[]>(`/api/bills/${id}/versions`);
      setVersions(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setVError(message);
    } finally {
      setVLoading(false);
    }
  };

  const closeDrawer = () => {
    setOpenId(null);
    setVersions(null);
  };

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return bills.slice(start, start + pageSize);
  }, [bills, page]);

  return (
    <div className="min-h-screen bg-zinc-10 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <header className="border-b bg-white/70 dark:bg-zinc-950/65 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Законодавчий моніторинг</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Слідкуйте за останніми змінами у законодавстві
            </p>
          </div>
          <a
            className="text-sm underline opacity-80 hover:opacity-100"
            href="/api/bills"
            target="_blank"
            rel="noreferrer"
          >
            API
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Filters
          sector={sector}
          setSector={setSector}
          level={level}
          setLevel={setLevel}
          q={qStr}
          setQ={setQStr}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          onSearch={load}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            {loading ? "Загрузка..." : `${bills.length} записів`}
            {error ? ` • ${error}` : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-50 cursor-pointer"
            >
              Попередня
            </button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-50 cursor-pointer"
            >
              Наступна
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {pageItems.map((b) => (
            <button
              key={b.id}
              onClick={() => openDrawer(b.id)}
              className="text-left p-4 rounded-xl border bg-white dark:bg-zinc-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <RiskBadge level={b.risk_level} score={b.risk_score} />
                <SectorBadge sector={b.sector} />
                {b.number ? (
                  <Chip className="bg-zinc-100 text-zinc-700">
                    № {b.number}
                  </Chip>
                ) : null}
                <span className="text-xs text-zinc-500 ml-auto">
                  {formatDate(b.registered_at || b.updated_at)}
                </span>
              </div>
              <div className="font-medium">{b.law_title || b.title}</div>
              <div className="text-sm text-zinc-600 line-clamp-1">
                {b.status || ""}
              </div>
            </button>
          ))}
        </div>
      </main>

      <Drawer
        open={!!openId}
        onClose={closeDrawer}
        title={selected?.title || "Details"}
      >
        {!selected ? null : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge
                level={selected.risk_level}
                score={selected.risk_score}
              />
              <SectorBadge sector={selected.sector} />
              {selected.number ? (
                <Chip className="bg-zinc-100 text-zinc-700">
                  № {selected.number}
                </Chip>
              ) : null}
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-sm underline"
              >
                Відкрити на сайті ВРУ ↗
              </a>
            </div>
            {selected.status ? (
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Статус: </span>
                {selected.status}
              </div>
            ) : null}
            <div className="text-xs text-zinc-500">
              Оновлено: {formatDate(selected.updated_at)}
            </div>

            <h3 className="text-base font-semibold">Версії</h3>
            {vLoading && <div className="text-sm">Завантаження версій…</div>}
            {vError && <div className="text-sm text-red-600">{vError}</div>}
            {!vLoading && versions && versions.length === 0 && (
              <div className="text-sm">Версій поки немає</div>
            )}
            <div className="space-y-4">
              {versions?.map((v) => (
                <div key={v.id} className="rounded-lg border overflow-hidden">
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between">
                    <div className="text-sm">{formatDate(v.fetched_at)}</div>
                    <div className="text-xs text-zinc-500">id: {v.id}</div>
                  </div>
                  <div className="p-3">
                    {v.diff_from_prev ? (
                      <pre className="text-xs overflow-auto whitespace-pre-wrap leading-5 p-3 rounded-lg bg-zinc-950 text-zinc-100">
                        {renderUnifiedDiff(v.diff_from_prev)}
                      </pre>
                    ) : (
                      <pre className="text-xs overflow-auto whitespace-pre-wrap leading-5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                        {v.content_preview ||
                          "(нема попереднього diff, показано прев'ю контенту)"}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
