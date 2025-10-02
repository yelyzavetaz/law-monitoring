import type { Bill } from "../types/billTypes";
import { Chip } from "./chip";

export const RiskBadge: React.FC<{
  level: Bill["risk_level"];
  score: number;
}> = ({ level, score }) => {
  const base = "border-0 text-white";
  const cls =
    level === "HIGH"
      ? "bg-red-600"
      : level === "MEDIUM"
      ? "bg-yellow-600"
      : "bg-emerald-600";
  return (
    <Chip className={`${base} ${cls}`} title={`Score: ${score}`}>
      {(() => {
        switch (level) {
          case "HIGH":
            return "ВИСОКИЙ";
          case "MEDIUM":
            return "СЕРЕДНІЙ";
          case "LOW":
            return "НИЗЬКИЙ";
        }
      })()}
      • {score}
    </Chip>
  );
};
