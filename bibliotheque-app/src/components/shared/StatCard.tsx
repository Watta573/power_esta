import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  titre: string;
  valeur: string | number;
  icone: ReactNode;
  variation?: number;
  couleur?: "default" | "danger";
}

export default function StatCard({ titre, valeur, icone, variation = 0, couleur = "default" }: StatCardProps) {
  const isPositive = variation >= 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-border bg-white p-4 shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-2">{titre}</p>
          <p className={`mt-2 text-2xl font-semibold ${couleur === "danger" ? "text-danger" : "text-text-1"}`}>{valeur}</p>
        </div>
        <span className="rounded-md bg-surface-2 p-2 text-primary">{icone}</span>
      </div>
      <div className={`mt-3 inline-flex items-center gap-1 text-xs ${isPositive ? "text-success" : "text-danger"}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{Math.abs(variation)}% vs hier</span>
      </div>
    </motion.article>
  );
}
