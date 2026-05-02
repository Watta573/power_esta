import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export default function NotFoundPage() {
  const [animData, setAnimData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/404.json")
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => setAnimData(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        {animData && (
          <Lottie animationData={animData} loop className="w-96 h-96" />
        )}

        <h1 className="mt-2 text-xl font-semibold text-gray-800">
          Cette page n'existe pas
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Elle a peut-être été déplacée ou supprimée.
        </p>

        <Link
          to="/accueil"
          className="mt-8 rounded-xl bg-[#1b4332] px-8 py-3 text-sm font-semibold text-white hover:bg-[#2d6a4f] transition-colors"
        >
          Retour à l'accueil
        </Link>
      </motion.div>
    </div>
  );
}
