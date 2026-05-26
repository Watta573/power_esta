import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { authApi } from "@/api/auth.api";

const forgotSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      setEmailSent(true);
      toast.success("Email envoyé avec succès");
    },
    onError: () => toast.error("Échec de l'envoi de l'email"),
  });

  if (emailSent) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-[#d8f3dc] via-white to-[#f3f8f4] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-4">
            Email envoyé !
          </h1>
          <p className="text-gray-600 mb-2">
            Si un compte existe avec l'adresse <strong>{getValues("email")}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Vérifiez également votre dossier spam.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] px-6 py-3 font-semibold text-white shadow-lg transition hover:from-[#163828] hover:to-[#24563f]"
          >
            <ArrowLeft size={18} />
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-[#d8f3dc] via-white to-[#f3f8f4] px-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          {/* Icône */}
          <div className="flex justify-center">
            <div className="rounded-full bg-[#d8f3dc] p-4">
              <Mail size={32} className="text-[#1b4332]" />
            </div>
          </div>

          {/* Titre */}
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              Mot de passe oublié ?
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Pas de problème. Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
                placeholder="Entrez votre email"
                className={`block w-full rounded-lg border ${
                  errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-[#1b4332] focus:ring-[#1b4332]"
                } py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Bouton */}
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
                Envoi en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send size={18} />
                Envoyer le lien
              </span>
            )}
          </button>

          {/* Lien retour */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>
        </form>
      </div>
    </div>
  );
}
