import { Navigate, createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ProtectedRoute, AdminOnly, AdminRoute, PublicOnlyRoute } from "./guards";
import AccueilPage  from "@/pages/public/AccueilPage";
import NotFoundPage from "@/pages/public/NotFoundPage";

import ChangePasswordPage    from "@/pages/auth/ChangePasswordPage";
import ForgotPasswordPage    from "@/pages/auth/ForgotPasswordPage";
import LoginPage             from "@/pages/auth/LoginPage";
import RegisterPage          from "@/pages/auth/RegisterPage";
import ResetPasswordPage     from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage       from "@/pages/auth/VerifyEmailPage";
import DashboardPage         from "@/pages/dashboard/DashboardPage";
import CataloguePage         from "@/pages/livres/CataloguePage";
import LivreDetailPage       from "@/pages/livres/LivreDetailPage";
import LivreFormPage         from "@/pages/livres/LivreFormPage";
import EmpruntsPage          from "@/pages/emprunts/EmpruntsPage";
import PresentationEquipe    from "@/pages/presentation_equipe/presentation_equipe";
import NouvelEmpruntPage     from "@/pages/emprunts/NouvelEmpruntPage";
import ReservationsPage      from "@/pages/reservations/ReservationsPage";
import RelancesPage          from "@/pages/relances/RelancesPage";
import AmendesPage           from "@/pages/amendes/AmendesPage";
import RapportsPage          from "@/pages/rapports/RapportsPage";
import ProfilPage            from "@/pages/profil/ProfilPage";
import UtilisateursPage      from "@/pages/utilisateurs/UtilisateursPage";
import UtilisateurDetailPage from "@/pages/utilisateurs/UtilisateurDetailPage";
import UtilisateurFormPage   from "@/pages/utilisateurs/UtilisateurFormPage";
import AcquisitionsPage      from "@/pages/acquisitions/AcquisitionsPage";
import FinancesPage          from "@/pages/finances/FinancesPage";
import PersonnelPage         from "@/pages/personnel/PersonnelPage";
import FournisseursPage      from "@/pages/fournisseurs/FournisseursPage";
import PeriodiquesPagE       from "@/pages/periodiques/PeriodiquesPagE";
import CommunicationPage     from "@/pages/communication/CommunicationPage";
import AdministrationPage    from "@/pages/administration/AdministrationPage";
import AbonnementPage        from "@/pages/abonnement/AbonnementPage";
import EspaceMembrePage      from "@/pages/espace-membre/EspaceMembrePage";

export const router = createBrowserRouter([
  // Redirection par défaut vers l'accueil public
  { path: "/",               element: <Navigate to="/accueil" replace /> },
  // Pages publiques accessibles sans connexion
  { path: "/accueil",         element: <AccueilPage /> },
  { path: "/login",           element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
  { path: "/register",        element: <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute> },
  { path: "/forgot-password", element: <PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute> },
  { path: "/reset-password",  element: <PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute> },
  { path: "/verify-email",    element: <VerifyEmailPage /> },
  { path: "/presentation-equipe", element: <PresentationEquipe /> },

  // Application protégée
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },

      { path: "dashboard",       element: <DashboardPage /> },
      { path: "livres",          element: <CataloguePage /> },
      { path: "livres/:id",      element: <LivreDetailPage /> },
      { path: "profil",          element: <ProfilPage /> },
      { path: "change-password", element: <ChangePasswordPage /> },
      { path: "communication",   element: <CommunicationPage /> },
      { path: "finances",        element: <FinancesPage /> },
      { path: "abonnement",      element: <AbonnementPage /> },
      { path: "acquisitions",    element: <AcquisitionsPage /> },
      { path: "espace-membre",   element: <EspaceMembrePage /> },

      { path: "emprunts",         element: <EmpruntsPage /> },
      { path: "emprunts/nouveau", element: <AdminRoute><NouvelEmpruntPage /></AdminRoute> },

      { path: "reservations", element: <ReservationsPage /> },
      { path: "periodiques",  element: <PeriodiquesPagE /> },

      { path: "utilisateurs",               element: <AdminRoute><UtilisateursPage /></AdminRoute> },
      { path: "utilisateurs/:id",           element: <AdminRoute><UtilisateurDetailPage /></AdminRoute> },
      { path: "admin/utilisateurs/nouveau", element: <AdminRoute><UtilisateurFormPage /></AdminRoute> },
      { path: "admin/livres/nouveau",       element: <AdminRoute><LivreFormPage /></AdminRoute> },
      { path: "admin/livres/:id/modifier",  element: <AdminRoute><LivreFormPage /></AdminRoute> },
      { path: "relances",                   element: <AdminRoute><RelancesPage /></AdminRoute> },
      { path: "amendes",                    element: <AdminRoute><AmendesPage /></AdminRoute> },
      { path: "rapports",                   element: <AdminRoute><RapportsPage /></AdminRoute> },

      { path: "administration", element: <AdminOnly><AdministrationPage /></AdminOnly> },
      { path: "personnel",      element: <AdminOnly><PersonnelPage /></AdminOnly> },
      { path: "fournisseurs",   element: <AdminRoute><FournisseursPage /></AdminRoute> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);
