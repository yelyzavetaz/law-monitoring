export const Filters: React.FC<{
  sector: string;
  setSector: (s: string) => void;
  level: string;
  setLevel: (s: string) => void;
  q: string;
  setQ: (s: string) => void;
  dateFrom: string;
  setDateFrom: (s: string) => void;
  dateTo: string;
  setDateTo: (s: string) => void;
  onSearch: () => void;
}> = ({
  sector,
  setSector,
  level,
  setLevel,
  q,
  setQ,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onSearch,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[160px_160px_1fr_auto] items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600">Сектор</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="border rounded-lg px-3 py-2 cursor-pointer"
          >
            <option value="" className="text-zinc-500/75">Всі</option>
            <option value="SOCIAL" className="text-zinc-500/75">СОЦІАЛЬНИЙ</option>
            <option value="AGRI" className="text-zinc-500/75">АГРАРНИЙ</option>
            <option value="CORPORATE" className="text-zinc-500/75">КОРПОРАТИВНИЙ</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600">Ризик</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border rounded-lg px-3 py-2 cursor-pointer"
          >
            <option value="" className="text-zinc-500/75">Всі</option>
            <option value="HIGH" className="text-zinc-500/75">ВИСОКИЙ</option>
            <option value="MEDIUM" className="text-zinc-500/75">СЕРЕДНІЙ</option>
            <option value="LOW" className="text-zinc-500/75">НИЗЬКИЙ</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600">Пошук</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Назва / URL / тег"
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <button
          onClick={onSearch}
          className="h-[42px] px-4 rounded-lg bg-zinc-950 hover:bg-zinc-950/70 text-white hover:opacity-90 cursor-pointer"
        >
          Застосувати
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[200px_200px_1fr] items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600">Дата з</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600">Дата до</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(
                today.getTime() - 7 * 24 * 60 * 60 * 1000
              );
              setDateFrom(weekAgo.toISOString().split("T")[0]);
              setDateTo(today.toISOString().split("T")[0]);
            }}
            className="px-4 py-2.5 text-sm rounded-lg border hover:bg-zinc-700 cursor-pointer"
          >
            Останній тиждень
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const monthAgo = new Date(
                today.getTime() - 30 * 24 * 60 * 60 * 1000
              );
              setDateFrom(monthAgo.toISOString().split("T")[0]);
              setDateTo(today.toISOString().split("T")[0]);
            }}
            className="px-3 py-2 text-sm rounded-lg border hover:bg-zinc-700 cursor-pointer"
          >
            Останній місяць
          </button>
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="px-3 py-2 text-sm rounded-lg border hover:bg-zinc-700 cursor-pointer"
          >
            Очистити
          </button>
        </div>
      </div>
    </div>
  );
};
