import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Eye, EyeOff, BookOpen, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/stores/auth.store";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", motDePasse: "" },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.token, data.refreshToken, data.utilisateur);
      navigate("/dashboard");
    },
  });

  const onSubmit = (values: LoginForm) => loginMutation.mutate(values);

  return (
    <div className="grid min-h-screen grid-cols-1 bg-gradient-to-br from-[#d8f3dc] via-white to-[#f3f8f4] lg:grid-cols-2">
      {/* Section gauche, Branding */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#f0f7f4] px-12 py-14">
        {/* Cercles décoratifs doux */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#1b4332]/6" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#1b4332]/5" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e9c46a]/10" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b4332]">
            <BookOpen size={20} className="text-[#e9c46a]" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900">Bibliothèque</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1b4332]">ESTA</p>
          </div>
        </div>

        {/* Contenu central */}
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#2d6a4f]">Bienvenue</p>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900">
            Votre portail vers<br />
            <span className="text-[#1b4332]">la connaissance</span>
          </h1>
          <p className="mb-10 text-base text-gray-500 leading-relaxed">
            Accédez à des milliers de ressources académiques, gérez vos emprunts et réservations en toute simplicité.
          </p>

          <div className="space-y-3">
            {[
              { label: "Catalogue numérique complet", sub: "Milliers d'ouvrages disponibles" },
              { label: "Emprunts & réservations en ligne", sub: "Gestion simplifiée depuis votre espace" },
              { label: "Rappels automatiques", sub: "Ne manquez plus une date de retour" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1b4332]">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer bas */}
        <p className="relative text-xs text-gray-600">© {new Date().getFullYear()} Bibliothèque ESTA</p>
      </section>

      {/* Section droite, Formulaire */}
      <section className="grid place-items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="rounded-full bg-gradient-to-br from-[#1b4332] to-[#0d2b1f] p-4">
              <BookOpen size={32} className="text-white" />
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
          >
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-gray-900">
                Connexion
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Accédez à votre espace bibliothèque
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={`block w-full rounded-lg border ${
                    errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-[#1b4332] focus:ring-[#1b4332]"
                  } py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2`}
                  placeholder="Entrez votre email"
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("motDePasse")}
                  className={`block w-full rounded-lg border ${
                    errors.motDePasse ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-[#1b4332] focus:ring-[#1b4332]"
                  } py-3 pl-10 pr-12 text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2`}
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.motDePasse && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {errors.motDePasse.message}
                </p>
              )}
            </div>

            {/* Erreur API */}
            {loginMutation.isError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  <p className="text-sm font-medium text-red-800">
                    Identifiants invalides. Veuillez réessayer.
                  </p>
                </div>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
              className="w-full rounded-lg bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] py-3 font-semibold text-white shadow-lg transition hover:from-[#163828] hover:to-[#24563f] focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>

            {/* Liens */}
            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-gray-500 hover:text-gray-700 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
              <Link
                to="/register"
                className="font-medium text-[#1b4332] hover:text-[#2d6a4f] hover:underline"
              >
                Créer un compte
              </Link>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-500">
            En vous connectant, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </section>
    </div>
  );
}
