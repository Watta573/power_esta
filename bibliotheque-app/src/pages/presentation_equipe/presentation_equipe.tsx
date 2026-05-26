import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ArrowLeft,
  Mail,
  Cpu,
  Palette,
  ExternalLink,
  Server,
  Database,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Terminal as TerminalIcon,
  Sparkles,
  Check
} from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  nickname: string;
  role: string;
  description: string;
  longBio: string;
  initials: string;
  photo: string;
  icon: React.ComponentType<any>;
  themeColor: string;
  socials: {
    github?: string;
    linkedin?: string;
    email: string;
  };
  skills: {
    category: string;
    items: string[];
  }[];
  parcours: {
    period: string;
    title: string;
    description: string;
  }[];
}

// Données de l'équipe
const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: "Ouattara Auguste Elvis",
    nickname: "Elvithon_Dev",
    role: "Lead Full-Stack Developer & Architecte Système",
    description: "Concepteur de l'architecture serveur Spring Boot, de la modélisation relationnelle de la base de données et de la sécurité par jetons JWT.",
    longBio: "Étudiant-Ingénieur à l'ESTA doté d'une profonde passion pour la conception de systèmes robustes et scalables. Convaincu que la clarté du code reflète la rigueur de la pensée, Elvis a dirigé l'établissement de l'API RESTful sous Spring Boot, orchestré les schémas de données relationnels PostgreSQL et co-développé l'intégration système multi-plateforme avec Tauri.",
    initials: "AO",
    photo: "/team/elvis.jpg",
    icon: Cpu,
    themeColor: "text-[#1b4332] dark:text-[#d8f3dc]",
    socials: {
      github: "https://github.com/Watta573/",
      email: "elvithondev@gmail.com"
    },
    skills: [
      {
        category: "Mobile & Frontend",
        items: ["Flutter", "React.js", "Tauri", "Vue.js", "Angular", "React Native", "Tailwind CSS", "JavaScript", "TypeScript", "Visual Basic", "Bootstrap"]
      },
      {
        category: "Backend & Frameworks",
        items: ["Spring Boot (Java)", "Laravel", "Symfony", "Go", "Prisma", "Rust", "WordPress"]
      },
      {
        category: "Bases de données",
        items: ["PostgreSQL", "DBeaver", "SQLite", "Firebase", "MongoDB", "Redis", "Neon", "Back4App", "PhpMyAdmin"]
      }
    ],
    parcours: [
      { period: "Mars 2026", title: "Conception & Architecture UML", description: "Conception du cahier des charges technique et élaboration de 22 diagrammes UML structurels." },
      { period: "Avril 2026", title: "Développement Core API & Sec", description: "Déploiement du serveur Spring Boot, persistance des données JPA et sécurisation d'accès JWT." },
      { period: "Mai 2026", title: "Intégration & Tauri Desktop", description: "Mise en place de la synchronisation d'état et empaquetage de l'application bureautique native." }
    ]
  },
  {
    id: 2,
    name: "Koussoube Drissa",
    nickname: "Alpha",
    role: "Développeur Web",
    description: "Spécialiste HTML/CSS, Java, PHP et PhpMyAdmin, assurant une intégration fiable entre interface et base de données.",
    longBio: "Étudiant-Ingénieur à l'ESTA centrée sur la rigueur du code web classique. Drissa met en œuvre des interfaces stables et des backends PHP/Java robustes tout en gérant efficacement l'administration de données avec PhpMyAdmin.",
    initials: "KD",
    photo: "/team/drissa.jpg",
    icon: Palette,
    themeColor: "text-[#d0a85c] dark:text-[#e9c46a]",
    socials: {
      github: "https://github.com",
      email: "drissakoussoube54@gmail.com"
    },
    skills: [
      {
        category: "Frontend",
        items: ["HTML5", "CSS3", "Visual Basic", "Angular", "TypeScript"]
      },
      {
        category: "Backend",
        items: ["Java", "PHP"]
      },
      {
        category: "Bases de données",
        items: ["PhpMyAdmin", "PostgreSQL", "MySQL"]
      }
    ],
    parcours: [
      { period: "Mars 2026", title: "Prototype HTML/CSS", description: "Création des pages statiques et des interfaces adaptatives en HTML et CSS." },
      { period: "Avril 2026", title: "Développement Java et PHP", description: "Implémentation des services métiers et de la logique serveur avec Java et PHP." },
      { period: "Mai 2026", title: "Administration de base de données", description: "Gestion des schémas et des données via PostgreSQL pour l'application." }
    ]
  }
];

const HERO_BADGES = [
  { icon: Palette, label: "Design chaleureux" },
  { icon: Server, label: "Backend fiable" },
  { icon: Database, label: "Données maîtrisées" },
  { icon: Smartphone, label: "Mobile-ready" }
];

const PROJECT_STATS = [
  { label: "Code clair", value: "100%", description: "TypeScript / Java" },
  { label: "Diagrammes", value: "22+", description: "UML & architecture" },
  { label: "Développement", value: "2 Mois", description: "Itérations agiles" },
  { label: "Créateurs", value: "2", description: "Ingénieurs ESTA" }
];

export default function PresentationEquipe() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("competences");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [typedCount, setTypedCount] = useState(0);

  const currentMember = TEAM_MEMBERS[activeIndex];
  const MemberIcon = currentMember.icon;

  const handleNext = () => {
    setActiveIndex((prev) => (prev === TEAM_MEMBERS.length - 1 ? 0 : prev + 1));
    setActiveTab("competences");
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? TEAM_MEMBERS.length - 1 : prev - 1));
    setActiveTab("competences");
  };

  const getTechStyle = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("front") || cat.includes("interface")) {
      return {
        bg: "bg-[#FAF2EE]/50 dark:bg-[#2A1D1A]/50 border-[#EAD4C9]/70 dark:border-[#432A22]/70 hover:border-[#E06945] dark:hover:border-[#E06945]",
        text: "text-[#CC5A37] dark:text-[#E06945]",
        bullet: "bg-[#CC5A37]/5 dark:bg-[#E06945]/10 border-[#CC5A37]/10 dark:border-[#E06945]/20 text-[#CC5A37] dark:text-[#E06945]"
      };
    }
    if (cat.includes("back") || cat.includes("framework")) {
      return {
        bg: "bg-[#F0F5F2]/50 dark:bg-[#13221A]/50 border-[#D1E2D9]/70 dark:border-[#223B2F]/70 hover:border-[#1E4A35] dark:hover:border-[#86C4A2]",
        text: "text-[#1E4A35] dark:text-[#86C4A2]",
        bullet: "bg-[#1E4A35]/5 dark:bg-[#86C4A2]/10 border-[#1E4A35]/10 dark:border-[#86C4A2]/20 text-[#1E4A35] dark:text-[#86C4A2]"
      };
    }
    // Bases de données / Intégrations
    return {
      bg: "bg-[#FAF7EE]/50 dark:bg-[#252219]/50 border-[#EADFB8]/70 dark:border-[#3A3525]/70 hover:border-[#A67C1E] dark:hover:border-[#E8C88A]",
      text: "text-[#A67C1E] dark:text-[#E8C88A]",
      bullet: "bg-[#A67C1E]/5 dark:bg-[#E8C88A]/10 border-[#A67C1E]/10 dark:border-[#E8C88A]/20 text-[#A67C1E] dark:text-[#E8C88A]"
    };
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1c1c1a] dark:bg-[#0e0e0c] dark:text-[#e4e4e0] font-sans antialiased selection:bg-[#1b4332]/10 dark:selection:bg-[#e9c46a]/10 transition-colors duration-300">

      {/* Bordures de grille éditoriale */}
      <div className="absolute inset-0 pointer-events-none border-x border-[#e6e2da]/40 dark:border-[#242420]/40 max-w-6xl mx-auto z-0" />

      {/* En-tête */}
      <header className="sticky top-0 z-40 border-b border-[#dcd6cc] bg-[#f7f4ee]/95 backdrop-blur dark:border-[#1a1a1f] dark:bg-[#090b0f]/95 transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#1b4332] dark:text-[#d8f3dc]">ESTA</span>
            <span className="text-xs font-medium text-[#4f4b45] dark:text-[#9c9c95]">Présentation équipe</span>
          </div>

          <Link
            to="/accueil"
            className="inline-flex items-center gap-2 rounded-lg border border-[#dcd6cc] bg-white px-4 py-2 text-xs font-semibold text-[#1f1f1d] shadow-sm transition hover:border-[#1b4332] hover:text-[#1b4332] dark:border-[#212126] dark:bg-[#111317] dark:text-[#e6e6e4] dark:hover:border-[#e9c46a] dark:hover:text-[#e9c46a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      {/* Section hero */}
      <section className="relative overflow-hidden top-1 rounded-[0px] border border-[#dcd6cc] bg-white px-6 py-16 shadow-[0_40px_120px_rgba(28,28,26,0.08)] dark:border-[#151519] dark:bg-[#0d1118] dark:shadow-none">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/2 rounded-full bg-[#e9c46a]/15 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-32 w-32 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#1b4332]/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-black dark:text-[#e9c46a] mb-3">
            CONCEPTEURS
          </p>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#1c1c1a] dark:text-white md:text-5xl lg:text-6xl mb-6">
            Les bâtisseurs du <span className="text-[#dfbf56e4] dark:text-[#e9c46a]">savoir digital</span>
          </h1>

          <p className="max-w-3xl text-base leading-8 text-[#525148] dark:text-[#b9b9b4]">
            Une interface signée par Elvithon Dev et Alpha, alliant structure solide, navigation fluide et ambiance inspirée du design chaud et élégant.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {HERO_BADGES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-[#969186] bg-[#fbf8f1] px-5 py-4 dark:border-[#212126] dark:bg-[#111418]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-[#a382d3] text-white dark:bg-[#e9c46a]/15 dark:text-[#e9c46a]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-black dark:text-[#ececea]">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="mx-auto max-w-6xl px-6 py-12 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Colonne gauche : sélection & portrait */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">

            {/* Conteneur monogramme */}
            <div className="border border-[#e6e2da] dark:border-[#242420] bg-white dark:bg-[#131311] rounded-2xl p-8 flex flex-col justify-between h-[360px] shadow-sm relative overflow-hidden group transition-all duration-300">
              {/* Informations principales */}
              <div className="flex justify-between items-start">
                <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600 tracking-wider">
                  MEMBRE 0{currentMember.id}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#1b4332] dark:text-[#e9c46a] font-bold bg-[#faf9f5] dark:bg-[#1a1a17] px-2.5 py-1 rounded border border-[#e6e2da] dark:border-[#2b2b25]">
                  {currentMember.nickname}
                </span>
              </div>

              {/* Photo de profil / Initiales de secours */}
              <div className="flex items-center justify-center my-6 select-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="h-28 w-28 rounded-3xl border-2 border-[#e6e2da] dark:border-[#2b2b25] bg-[#faf9f5] dark:bg-[#1a1a17] flex items-center justify-center shadow-lg overflow-hidden"
                  >
                    {currentMember.photo ? (
                      <img
                        src={currentMember.photo}
                        alt={currentMember.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-4xl font-light font-serif tracking-widest text-[#1c1c1a] dark:text-white ${currentMember.photo ? 'hidden' : ''}`}>
                      {currentMember.initials}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pied d’identité */}
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-2xl font-normal font-serif tracking-tight text-[#1c1c1a] dark:text-white leading-none mb-2">
                      {currentMember.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {currentMember.role}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Contrôles de navigation */}
            <div className="flex items-center justify-between border border-[#e6e2da] dark:border-[#242420] rounded-xl p-4 bg-white dark:bg-[#131311]">
              <button
                onClick={handlePrev}
                className="font-mono text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1.5 cursor-pointer text-[#1c1c1a] dark:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>[ préc ]</span>
              </button>

              <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-600">
                0{activeIndex + 1} / 02
              </span>

              <button
                onClick={handleNext}
                className="font-mono text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1.5 cursor-pointer text-[#1c1c1a] dark:text-white"
              >
                <span>[ suiv ]</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Colonne droite : onglets dynamiques */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                {/* Carte de présentation */}
                <div className="border border-[#e6e2da] dark:border-[#242420] bg-white dark:bg-[#131311] rounded-2xl p-8 shadow-sm space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-gray-400">BIOGRAPHIE</span>
                    <h3 className="text-xl font-normal font-serif tracking-tight mt-1 text-[#1c1c1a] dark:text-white">
                      Profil & Rôle Technique
                    </h3>
                  </div>

                  <p className="text-base text-[#4a4a45] dark:text-[#9c9c95] leading-relaxed">
                    {currentMember.longBio}
                  </p>

                  <div className="flex gap-4 pt-2">
                    <a
                      href={`mailto:${currentMember.socials.email}`}
                      className="inline-flex items-center gap-2 border border-[#e6e2da] dark:border-[#2b2b25] bg-[#faf9f5] dark:bg-[#1a1a17] hover:opacity-85 transition-opacity px-4 py-2.5 rounded-lg text-xs font-mono font-bold"
                    >
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>Email</span>
                    </a>
                    {currentMember.socials.github && (
                      <a
                        href={currentMember.socials.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 border border-[#e6e2da] dark:border-[#2b2b25] bg-[#faf9f5] dark:bg-[#1a1a17] hover:opacity-85 transition-opacity px-4 py-2.5 rounded-lg text-xs font-mono font-bold"
                      >
                        <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                          <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Barre d’onglets */}
                <div className="flex border-b border-[#e6e2da] dark:border-[#242420] gap-8 pb-px">
                  {[
                    { id: "competences", label: "[ 01: Compétences ]" },
                    { id: "chronologie", label: "[ 02: Chronologie ]" },
                  ].map((tab) => {
                    const isTabActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 text-xs font-mono font-bold tracking-wider transition-all relative cursor-pointer ${isTabActive
                          ? "text-[#1c1c1a] dark:text-white"
                          : "text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
                          }`}
                      >
                        {tab.label}
                        {isTabActive && (
                          <motion.div
                            layoutId="tabUnderline"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1c1c1a] dark:bg-[#e9c46a]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Panneau de contenu */}
                <div className="min-h-[300px]">

                  {/* ONGLET 1 : Compétences */}
                  {activeTab === "competences" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {currentMember.skills.map((group) => {
                        const style = getTechStyle(group.category);
                        const Icon = group.category.toLowerCase().includes("front") || group.category.toLowerCase().includes("interface") || group.category.toLowerCase().includes("mobile")
                          ? Smartphone
                          : (group.category.toLowerCase().includes("back") || group.category.toLowerCase().includes("framework") ? Server : Database);

                        const tagline = group.category.toLowerCase().includes("mobile")
                          ? "Frameworks cross-platform et architectures web réactives."
                          : group.category.toLowerCase().includes("back")
                            ? "Conception d'APIs REST, logique d'accès et serveurs robustes."
                            : group.category.toLowerCase().includes("bases")
                              ? "Modélisation relationnelle, indexation et persistance sécurisée."
                              : group.category.toLowerCase().includes("front")
                                ? "Design adaptatif, maquettage et expérience utilisateur fluide."
                                : group.category.toLowerCase().includes("gestion")
                                  ? "Orchestration globale de l'état applicatif et réactivité."
                                  : "Communication client-serveur et architectures asynchrones.";

                        return (
                          <div
                            key={group.category}
                            className="border border-[#dcd6cc] bg-[#fbf8f1]/35 dark:border-[#212126] dark:bg-[#111418]/30 rounded-2xl p-6 shadow-sm hover:border-[#1b4332] dark:hover:border-[#e9c46a] transition-all duration-300 space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#dcd6cc]/40 dark:border-[#212126]/40">
                              <div className="flex items-center gap-3">
                                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${style.bullet}`}>
                                  <Icon className="h-5 w-5" />
                                </span>
                                <div>
                                  <h4 className="text-sm font-bold text-[#1c1c1a] dark:text-white font-serif">
                                    {group.category}
                                  </h4>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-none">
                                    {tagline}
                                  </p>
                                </div>
                              </div>
                              <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl border self-start sm:self-auto ${style.bullet}`}>
                                {group.items.length} technologies
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              {group.items.map((tech) => (
                                <div
                                  key={tech}
                                  className={`border rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-sm hover:-translate-y-[1.5px] hover:shadow-md transition-all duration-300 cursor-default ${style.bg}`}
                                >
                                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/60 dark:bg-black/20 border border-current/10">
                                    <Check className="h-2 w-2 text-current" />
                                  </span>
                                  <span className={`text-[11px] font-black tracking-wide ${style.text}`}>
                                    {tech}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* ONGLET 2 : Chronologie */}
                  {activeTab === "chronologie" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-[#e6e2da] dark:border-[#242420] bg-white dark:bg-[#131311] rounded-2xl p-8 shadow-sm divide-y divide-[#e6e2da] dark:divide-[#242420]"
                    >
                      {currentMember.parcours.map((item, index) => (
                        <div key={index} className={`py-6 first:pt-0 last:pb-0 group`}>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${activeIndex === 0
                                ? "text-[#1E4A35] dark:text-[#86C4A2] bg-[#F0F5F2] dark:bg-[#13221A] border-[#D1E2D9] dark:border-[#223B2F]"
                                : "text-[#A67C1E] dark:text-[#E8C88A] bg-[#FAF7EE] dark:bg-[#252219] border-[#EADFB8] dark:border-[#3A3525]"
                                }`}>
                                {item.period}
                              </span>
                              <h4 className="text-base font-bold text-[#1c1c1a] dark:text-white mt-3 font-serif">
                                {item.title}
                              </h4>
                              <p className="text-xs text-[#6e6e69] dark:text-[#9c9c95] mt-1.5 leading-relaxed font-medium">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* ONGLET 3 : Maquettes lab */}
                  {activeTab === "console" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-[#e6e2da] dark:border-[#242420] rounded-2xl bg-white dark:bg-[#131311] p-6 md:p-8 shadow-sm relative overflow-hidden"
                    >
                      {/* Terminal de logs serveur Elvis */}
                      {activeIndex === 0 && (
                        <div className="font-mono text-xs text-gray-700 dark:text-gray-300">
                          <div className="flex items-center justify-between border-b border-[#e6e2da] dark:border-[#242420] pb-4 mb-4">
                            <div className="flex items-center gap-2">
                              <TerminalIcon className="h-4 w-4 text-emerald-600 dark:text-[#e9c46a]" />
                              <span className="font-bold text-gray-900 dark:text-white">esta-server-console.log</span>
                            </div>
                            <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-[#e9c46a] animate-pulse" />
                          </div>

                          <div className="space-y-1.5 h-44 overflow-y-auto scrollbar-thin select-all font-mono leading-relaxed text-[11px] text-[#4a4a45] dark:text-[#a8a8a2]">
                            {terminalLogs.map((log, i) => (
                              <p key={i} className="font-mono">
                                <span className="text-gray-400 dark:text-gray-600 mr-2 font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                                {log}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Maquette UX Drissa */}
                      {activeIndex === 1 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-[#e6e2da] dark:border-[#242420] pb-4 mb-2">
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4 text-[#d0a85c] dark:text-[#e9c46a]" />
                              <span className="font-bold text-gray-900 dark:text-white">Lab de Composants React</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 tracking-wider">PREVIEW EN DIRECT</span>
                          </div>

                          <div className="space-y-4">
                            <p className="text-xs text-[#8a8a82] dark:text-[#9c9c95] font-medium">
                              Simulation d'un composant de bouton d'emprunt interactif codé pour la plateforme :
                            </p>

                            <div className="border border-[#e6e2da] dark:border-[#242420] rounded-xl p-6 bg-[#faf9f5] dark:bg-[#1a1a17] flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="text-left">
                                <p className="text-xs font-bold text-gray-900 dark:text-white">L'art de l'ingénierie logicielle</p>
                                <p className="text-[10px] font-mono text-gray-400 mt-0.5">Disponible Bibliothèque ESTA</p>
                              </div>

                              <button className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold bg-[#1b4332] dark:bg-[#e9c46a] text-white dark:text-[#0c0c0a] hover:opacity-90 active:scale-95 transition-all shadow-sm">
                                [ Emprunter l'ouvrage ]
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* Section narrative : chronologie de conception */}
      <section className="px-6 py-20 bg-white dark:bg-[#131311] border-t border-[#e6e2da] dark:border-[#242420] relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-black dark:text-[#e9c46a]">
              02: CHRONOLOGIE DU PROJET
            </span>
            <h2 className="text-3xl font-light font-serif tracking-tight mt-2 text-[#1c1c1a] dark:text-white">
              De la conception à la <span className="italic font-normal font-serif">Livraison</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#e6e2da]/70 dark:border-[#242420]/70 pt-8">
            <div className="space-y-8">
              <div>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-600">PHASE 01: Début Mars 2026</span>
                <h4 className="text-lg font-bold text-[#1c1c1a] dark:text-white mt-2 font-serif">
                  Architecture & diagrammes UML
                </h4>
                <p className="text-xs text-[#5e5e59] dark:text-[#9c9c95] mt-2 leading-relaxed">
                  Conception des spécifications techniques de la plateforme. Modélisation de 22 diagrammes UML structurels et comportementaux décrivant l'ensemble du cycle de vie des livres et emprunts.
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-600">PHASE 02: Avril 2026</span>
                <h4 className="text-lg font-bold text-[#1c1c1a] dark:text-white mt-2 font-serif">
                  Architecture RESTful & Database
                </h4>
                <p className="text-xs text-[#5e5e59] dark:text-[#9c9c95] mt-2 leading-relaxed">
                  Consolidation de la base de données PostgreSQL. Construction de la couche d'accès aux données JPA sous Spring Boot (Java) et sécurité par clés d'accès JWT.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-600">PHASE 03: Fin Avril - Mai 2026</span>
                <h4 className="text-lg font-bold text-[#1c1c1a] dark:text-white mt-2 font-serif">
                  Client React TypeScript
                </h4>
                <p className="text-xs text-[#5e5e59] dark:text-[#9c9c95] mt-2 leading-relaxed">
                  Développement de l'interface dynamique en React 19. Intégration de Zustand pour la gestion globale de l'état applicatif et de Recharts pour la visualisation graphique des statistiques financières.
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-600">PHASE 04: Courant 2026</span>
                <h4 className="text-lg font-bold text-[#1c1c1a] dark:text-white mt-2 font-serif">
                  Packaging natif Tauri
                </h4>
                <p className="text-xs text-[#5e5e59] dark:text-[#9c9c95] mt-2 leading-relaxed">
                  Empaquetage bureautique à l'aide de Tauri (Rust/JavaScript) pour compiler l'application web en un exécutable natif de bureau ultra-léger et hautement performant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques du projet */}
      <section className="px-6 py-16 bg-[#faf9f5] dark:bg-[#0e0e0c] border-t border-[#e6e2da] dark:border-[#242420] relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM_MEMBERS[0].skills.slice(0, 1).map(() => ( 
              <React.Fragment key="stats">
                <div className="text-left border-l border-[#e6e2da] dark:border-[#242420] pl-6 py-2">
                  <span className="font-mono text-[9px] font-bold text-black uppercase tracking-widest block">CODE PROPRE</span>
                  <span className="text-3xl font-light font-serif mt-1 block">100%</span>
                  <span className="text-[10px] text-gray-700 dark:text-gray-500 font-medium">React + Tauri + Spring Boot</span>
                </div>
                <div className="text-left border-l border-[#e6e2da] dark:border-[#242420] pl-6 py-2">
                  <span className="font-mono text-[9px] font-bold text-black uppercase tracking-widest block">MODÉLISATION</span>
                  <span className="text-3xl font-light font-serif mt-1 block">22+</span>
                  <span className="text-[10px] text-gray-700 dark:text-gray-500 font-medium">Diagrammes UML</span>
                </div>
                <div className="text-left border-l border-[#e6e2da] dark:border-[#242420] pl-6 py-2">
                  <span className="font-mono text-[9px] font-bold text-black uppercase tracking-widest block">DÉVELOPPEMENT</span>
                  <span className="text-3xl font-light font-serif mt-1 block">2 Mois</span>
                  <span className="text-[10px] text-gray-700 dark:text-gray-500 font-medium">De conception agile</span>
                </div>
                <div className="text-left border-l border-[#e6e2da] dark:border-[#242420] pl-6 py-2">
                  <span className="font-mono text-[9px] font-bold text-black uppercase tracking-widest block">CRÉATEURS</span>
                  <span className="text-3xl font-light font-serif mt-1 block">2</span>
                  <span className="text-[10px] text-gray-700 dark:text-gray-500 font-medium">Ingénieurs ESTA</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Pied de page éditorial */}
      <footer className="border-t border-[#e6e2da] dark:border-[#242420] bg-white dark:bg-[#131311] px-6 py-12 text-center text-xs text-[#8a8a82] dark:text-[#6e6e69] relative z-10 transition-colors">
        <p className="font-medium">© {new Date().getFullYear()} Bibliothèque ESTA. Modélisé et Développé avec Rigueur Technique.</p>
        <p className="mt-2 text-[10px] font-mono font-bold tracking-widest uppercase text-black dark:text-white">
          Ouattara Auguste Elvis & Koussoube Drissa
        </p>
      </footer>

    </div>
  );
}