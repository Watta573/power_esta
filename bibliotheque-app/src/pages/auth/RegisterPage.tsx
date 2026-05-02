import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { User, Mail, Phone, Key, Lock, AlertCircle, CheckCircle2, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { authApi, getApiErrorMessage } from "@/api/auth.api";

const registerSchema = z.object({
  nom: z.string().min(2, "Nom trop court (min. 2 caractères)"),
  prenom: z.string().min(2, "Prénom trop court (min. 2 caractères)"),
  identifiant: z.string().min(3, "Identifiant trop court (min. 3 caractères)"),
  email: z.string().email("Email invalide"),
  telephone: z.string().regex(/^[0-9]{8,15}$/, "Téléphone invalide (8-15 chiffres)"),
  role: z.enum(["ADMIN", "BIBLIOTHECAIRE", "ETUDIANT", "ENSEIGNANT", "PUBLIC"]),
  motDePasse: z.string()
    .min(6, "Minimum 6 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  confirmerMotDePasse: z.string().min(1, "Confirmation requise"),
}).refine((data) => data.motDePasse === data.confirmerMotDePasse, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmerMotDePasse"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "ETUDIANT" },
  });

  const password = watch("motDePasse");
  const hasMinLength = password?.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      navigate("/login");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible de finaliser l'inscription")),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8f3dc] via-white to-[#f3f8f4] px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-[#1b4332] to-[#0d2b1f] p-4">
              <BookOpen size={40} className="text-white" />
            </div>
          </div>
          <h1 className="font-heading text-4xl font-bold text-gray-900">
            Créer un compte
          </h1>
          <p className="mt-2 text-gray-600">
            Rejoignez la bibliothèque universitaire
          </p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          <div className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Informations personnelles
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Nom */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom <span className="text-red-500"></span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      {...register("nom")}
                      placeholder="Entrez votre nom"
                      className={`block w-full rounded-lg border ${
                        errors.nom ? "border-red-300" : "border-gray-300"
                      } py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.nom && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.nom.message}
                    </p>
                  )}
                </div>

                {/* Prénom */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Prénom <span className="text-red-500"></span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      {...register("prenom")}
                      placeholder="Entrez votre prénom"
                      className={`block w-full rounded-lg border ${
                        errors.prenom ? "border-red-300" : "border-gray-300"
                      } py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.prenom && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.prenom.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500"></span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="Entrez votre email"
                      className={`block w-full rounded-lg border ${
                        errors.email ? "border-red-300" : "border-gray-300"
                      } py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.email && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone <span className="text-red-500"></span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone size={18} className="text-gray-400" />
                    </div>
                    <input
                      {...register("telephone")}
                      placeholder="Entrez votre numéro de téléphone"
                      className={`block w-full rounded-lg border ${
                        errors.telephone ? "border-red-300" : "border-gray-300"
                      } py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.telephone && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.telephone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informations de compte */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Informations de compte
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Identifiant */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Identifiant <span className="text-red-500"></span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Key size={18} className="text-gray-400" />
                    </div>
                    <input
                      {...register("identifiant")}
                      placeholder="Entrez votre identifiant"
                      className={`block w-full rounded-lg border ${
                        errors.identifiant ? "border-red-300" : "border-gray-300"
                      } py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.identifiant && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.identifiant.message}
                    </p>
                  )}
                </div>

                {/* Rôle */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Statut <span className="text-red-500"></span>
                  </label>
                  <select
                    {...register("role")}
                    className="block w-full rounded-lg border border-gray-300 py-3 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ETUDIANT">Étudiant</option>
                    <option value="ENSEIGNANT">Enseignant</option>
                    <option value="PUBLIC">Public</option>
                    <option value="BIBLIOTHECAIRE">Bibliothécaire</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe <span className="text-red-500"></span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      {...register("motDePasse")}
                      type="password"
                      placeholder="Entrez votre mot de passe"
                      className={`block w-full rounded-lg border ${
                        errors.motDePasse ? "border-red-300" : "border-gray-300"
                      } py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.motDePasse && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.motDePasse.message}
                    </p>
                  )}
                  {/* Indicateurs de force */}
                  <div className="space-y-1">
                    <div className={`flex items-center gap-1 text-xs ${hasMinLength ? "text-green-600" : "text-gray-400"}`}>
                      {hasMinLength ? <CheckCircle2 size={12} /> : <div className="h-3 w-3 rounded-full border border-current" />}
                      <span>Au moins 6 caractères</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${hasUpperCase ? "text-green-600" : "text-gray-400"}`}>
                      {hasUpperCase ? <CheckCircle2 size={12} /> : <div className="h-3 w-3 rounded-full border border-current" />}
                      <span>Une majuscule</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${hasNumber ? "text-green-600" : "text-gray-400"}`}>
                      {hasNumber ? <CheckCircle2 size={12} /> : <div className="h-3 w-3 rounded-full border border-current" />}
                      <span>Un chiffre</span>
                    </div>
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe <span className="text-red-500"></span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      {...register("confirmerMotDePasse")}
                      type="password"
                      placeholder="Confirmez votre mot de passe"
                      className={`block w-full rounded-lg border ${
                        errors.confirmerMotDePasse ? "border-red-300" : "border-gray-300"
                      } py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  {errors.confirmerMotDePasse && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.confirmerMotDePasse.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-lg bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] py-3 font-semibold text-white shadow-lg transition hover:from-[#163828] hover:to-[#24563f] focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Inscription en cours...
                </span>
              ) : (
                "Créer mon compte"
              )}
            </button>

            {/* Lien connexion */}
            <p className="text-center text-sm text-gray-600">
              Déjà inscrit ?{" "}
              <Link to="/login" className="font-medium text-[#1b4332] hover:text-[#2d6a4f] hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
