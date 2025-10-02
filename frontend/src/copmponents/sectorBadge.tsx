import type { Bill } from "../types/billTypes";
import { Chip } from "./chip";

export const SectorBadge: React.FC<{ sector: Bill["sector"] }> = ({
  sector,
}) => {
  if (!sector) return <Chip className="bg-gray-100 text-gray-700">—</Chip>;
  const map: Record<string, string> = {
    SOCIAL: "bg-blue-100 text-blue-800",
    AGRI: "bg-green-100 text-green-800",
    CORPORATE: "bg-purple-100 text-purple-800",
  };
  return (
    <Chip className={map[sector]}>
      {(() => {
        switch (sector) {
          case "SOCIAL":
            return "СОЦІАЛЬНИЙ";
          case "AGRI":
            return "АГРАРНИЙ";
          case "CORPORATE":
            return "КОРПОРАТИВНИЙ";
        }
      })()}
    </Chip>
  );
};
