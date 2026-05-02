import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen, faMagnifyingGlass, faUsers, faClipboardList,
  faLayerGroup, faArrowRight, faGraduationCap, faClock, faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { apiClient } from "@/api/client";

const FEATURES = [
  { icon: faMagnifyingGlass, title: "Catalogue en ligne", desc: "Recherchez parmi des milliers de livres, vérifiez la disponibilité en temps réel." },
  { icon: faClipboardList, title: "Gestion des emprunts", desc: "Empruntez, prolongez et retournez vos livres facilement depuis votre espace." },
  { icon: faClock, title: "Rappels automatiques", desc: "Recevez des rappels par email avant la date de retour pour éviter les amendes." },
  { icon: faShieldHalved, title: "Espace sécurisé", desc: "Votre compte est protégé. Gérez vos préférences et votre historique en toute sécurité." },
];

interface TopLivre {
  id: number;
  titre: string;
  auteur: string;
  couverture?: string;
}

interface PublicStats {
  totalLivres: number;
  exemplairesDisponibles: number;
  empruntsEnCours: number;
  reservationsEnAttente: number;
  topLivres: TopLivre[];
}

const FALLBACK_CAROUSEL_ITEMS: TopLivre[] = [
  { id: 1, titre: "L'art de l'ingénierie", auteur: "Auteur inconnu", couverture: "/images/book_cover_1.png" },
  { id: 2, titre: "Systèmes complexes", auteur: "Auteur inconnu", couverture: "/images/book_cover_2.png" },
  { id: 3, titre: "Design Moderne", auteur: "Auteur inconnu", couverture: "/images/book_cover_3.png" },
  { id: 4, titre: "Architecture Logicielle", auteur: "Auteur inconnu", couverture: "/images/book_cover_4.png" },
  { id: 5, titre: "Intelligence Artificielle", auteur: "Auteur inconnu", couverture: "/images/book_cover_5.png" },
];

export default function AccueilPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(2);

  useEffect(() => {
    let mounted = true;
    const refreshInterval = 15_000;

    const fetchStats = () => {
      setStatsLoading(true);
      apiClient
        .get<{
          totalLivres: number;
          exemplairesDisponibles: number;
          empruntsEnCours: number;
          reservationsEnAttente: number;
          topLivres: { livre: { id: number; titre: string; auteur: string }; nbEmprunts: number }[];
        }>("/statistiques/public")
        .then((response) => {
          if (!mounted) return;
          const data = response.data;

          setStats({
            totalLivres: data.totalLivres,
            exemplairesDisponibles: data.exemplairesDisponibles,
            empruntsEnCours: data.empruntsEnCours,
            reservationsEnAttente: data.reservationsEnAttente,
            topLivres: (data.topLivres ?? []).map((item, index) => ({
              id: item.livre.id,
              titre: item.livre.titre,
              auteur: item.livre.auteur,
              couverture: `/images/book_cover_${(index % 5) + 1}.png`,
            })),
          });
        })
        .catch((error) => {
          console.error("Impossible de charger les statistiques publiques :", error);
          if (mounted) setStats(null);
        })
        .finally(() => { if (mounted) setStatsLoading(false); });
    };

    fetchStats();
    const intervalId = window.setInterval(fetchStats, refreshInterval);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const carouselItems = stats?.topLivres && stats.topLivres.length > 0 ? stats.topLivres : FALLBACK_CAROUSEL_ITEMS;

  const fmt = (n?: number) => {
    if (n == null) return "0";
    return n.toLocaleString("fr-FR");
  };

  const STATS_ITEMS = [
    { icon: faBookOpen, label: "Livres totaux", value: stats ? fmt(stats.totalLivres) : null },
    { icon: faUsers, label: "Emprunts en cours", value: stats ? fmt(stats.empruntsEnCours) : null },
    { icon: faClipboardList, label: "Réservations en attente", value: stats ? fmt(stats.reservationsEnAttente) : null },
    { icon: faLayerGroup, label: "Exemplaires disponibles", value: stats ? fmt(stats.exemplairesDisponibles) : null },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/login?redirect=/livres&q=${encodeURIComponent(search.trim())}`);
    else navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1b4332]">
              <FontAwesomeIcon icon={faBookOpen} className="text-[#e9c46a]" style={{ fontSize: 16 }} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-gray-900">Bibliothèque</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1b4332]">ESTA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Se connecter
            </Link>
            <Link to="/register" className="rounded-lg bg-[#1b4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] transition-colors">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] pt-20 pb-0 text-white">
        <div className="mx-auto max-w-5xl text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
          >
            La bibliothèque de l'<span className="text-[#e9c46a]">ESTA</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-0 text-lg text-white/80 md:text-xl max-w-2xl mx-auto"
          >
            Accédez à des milliers de ressources académiques. Empruntez, réservez et gérez vos lectures en ligne.
          </motion.p>
        </div>

        {/* Ultra-Stylish Interactive Carousel */}
        <div className="relative -mt-12 flex h-96 md:h-[500px] w-full flex-col items-center justify-center overflow-hidden px-4">

          {/* Background Ambient Glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e9c46a]/30 blur-[100px] pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />

          <div
            className="relative flex h-full w-full items-center justify-center"
            style={{ perspective: 1200 }}
          >
            {carouselItems.map((book, idx) => {
              const isActive = activeImage === idx;
              const distance = idx - activeImage;
              const absDistance = Math.abs(distance);

              const xOffset = distance * 55; // tighter spacing
              const rotateY = distance * -25;
              const zOffset = absDistance * -80;

              const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
              // Les images sont servies à la racine (ex: /uploads), pas sous /api/uploads
              const resourceBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : (apiBase === '/api' ? '' : apiBase);

              const imgUrl = book.couverture 
                ? (book.couverture.startsWith('http') || book.couverture.startsWith('data:') || book.couverture.startsWith('/images')
                    ? book.couverture 
                    : `${resourceBase}${book.couverture.startsWith('/') ? '' : '/'}${book.couverture}`) 
                : `/images/book_cover_${(idx % 5) + 1}.png`;

              return (
                <motion.div
                  key={book.id || idx}
                  onClick={() => setActiveImage(idx)}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset }) => {
                    const swipe = offset.x;
                    if (swipe < -50 && activeImage < carouselItems.length - 1) {
                      setActiveImage(activeImage + 1);
                    } else if (swipe > 50 && activeImage > 0) {
                      setActiveImage(activeImage - 1);
                    }
                  }}
                  initial={false}
                  animate={{
                    x: `${xOffset}%`,
                    rotateY: rotateY,
                    z: zOffset,
                    scale: isActive ? 1 : 0.75,
                    opacity: absDistance > 2 ? 0 : 1,
                    zIndex: 20 - absDistance,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
                  className="absolute h-64 w-44 md:h-[360px] md:w-64 cursor-grab active:cursor-grabbing"
                  style={{ transformStyle: "preserve-3d" }}
                  title={book.titre}
                >
                  {/* Main Image */}
                  <div className={`relative h-full w-full overflow-hidden rounded-2xl border-[3px] bg-[#1b4332] transition-colors duration-500 ${isActive ? 'border-[#e9c46a] shadow-[0_0_40px_rgba(233,196,106,0.3)]' : 'border-white/10 shadow-2xl'}`}>
                    <img
                      src={imgUrl}
                      alt={book.titre || `Couverture ${idx}`}
                      className="h-full w-full object-cover"
                    />
                    {/* Dimming and Blur for inactive items */}
                    <motion.div
                      animate={{
                        opacity: isActive ? 0 : 0.6,
                        backdropFilter: isActive ? "blur(0px)" : "blur(4px)"
                      }}
                      className="absolute inset-0 bg-black/40 pointer-events-none"
                    />
                  </div>

                  {/* Floor Reflection */}
                  <div
                    className="absolute top-full left-0 mt-2 h-1/2 w-full origin-top scale-y-[-1] opacity-30 pointer-events-none"
                    style={{ maskImage: "linear-gradient(to top, transparent 20%, black 100%)", WebkitMaskImage: "linear-gradient(to top, transparent 20%, black 100%)" }}
                  >
                    <img
                      src={imgUrl}
                      alt=""
                      className="h-full w-full object-cover rounded-2xl"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Premium Controls */}
          <div className="absolute bottom-2 z-30 flex items-center gap-6 rounded-[6px] border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md shadow-2xl">
            {carouselItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`relative h-2 rounded-[6px] transition-all duration-500 ease-out ${activeImage === idx ? "w-10 bg-[#e9c46a]" : "w-2 bg-white/30 hover:bg-white/60"
                  }`}
              >
                {activeImage === idx && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-[#e9c46a] opacity-40"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200 bg-white px-6 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
          {STATS_ITEMS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.6, type: "spring", stiffness: 100 }}
              className="text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1b4332]/10">
                <FontAwesomeIcon icon={s.icon} className="text-[#1b4332]" style={{ fontSize: 20 }} />
              </div>
              {statsLoading
                ? <div className="mx-auto mb-1 h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
                : <p className="text-2xl font-bold text-gray-900">{s.value ?? "—"}</p>
              }
              <p className="text-sm text-gray-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">Tout ce dont vous avez besoin</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.15, duration: 0.8, type: "spring", stiffness: 80 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1b4332]/10">
                  <FontAwesomeIcon icon={f.icon} className="text-[#1b4332]" style={{ fontSize: 18 }} />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1b4332] px-6 py-16 text-center text-white">
        <h2 className="mb-3 text-2xl font-bold">Prêt à commencer ?</h2>
        <p className="mb-8 text-white/70">Créez votre compte gratuitement et accédez à toutes les ressources.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="flex items-center gap-2 rounded-xl bg-[#e9c46a] px-6 py-3 font-semibold text-[#1b4332] hover:bg-[#c9a227] transition-colors"
          >
            Créer un compte <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 13 }} />
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Bibliothèque ESTA. Tous droits réservés</p>
        <div className="mt-2 flex justify-center gap-6">
          <Link to="/login" className="hover:text-gray-600 transition-colors">Connexion</Link>
          <Link to="/register" className="hover:text-gray-600 transition-colors">Inscription</Link>
        </div>
      </footer>
    </div>
  );
}