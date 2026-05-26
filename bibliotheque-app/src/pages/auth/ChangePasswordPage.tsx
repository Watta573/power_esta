import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { authApi } from "@/api/auth.api";

const changePasswordSchema = z.object({
  ancienMotDePasse: z.string().min(1, "Mot de passe actuel requis"),
  nouveauMotDePasse: z.string()
    .min(6, "Minimum 6 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  confirmerMotDePasse: z.string().min(1, "Confirmation requise"),
}).refine((data) => data.nouveauMotDePasse === data.confirmerMotDePasse, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmerMotDePasse"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const password = watch("nouveauMotDePasse");
  const hasMinLength = (password?.length ?? 0) >= 6;
  const hasUpperCase = /[A-Z]/.test(password ?? "");
  const hasNumber = /[0-9]/.test(password ?? "");

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordForm) =>
      authApi.changePassword({ ancienMotDePasse: values.ancienMotDePasse, nouveauMotDePasse: values.nouveauMotDePasse }),
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès !");
      navigate("/profil");
    },
    onError: () => toast.error("Mot de passe actuel incorrect"),
  });

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 p-4">
              <Lock size={32} className="text-blue-600" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-gray-900">Changer le mot de passe</h1>
            <p className="mt-2 text-sm text-gray-600">Modifiez votre mot de passe</p>
          </div>

          {/* Ancien mot de passe */}
          <PasswordField
            id="oldPassword"
            label="Mot de passe actuel"
            show={showOldPassword}
            onToggle={() => setShowOldPassword(!showOldPassword)}
            registration={register("ancienMotDePasse")}
            error={errors.ancienMotDePasse?.message}
          />

          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <PasswordField
              id="newPassword"
              label="Nouveau mot de passe"
              show={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
              registration={register("nouveauMotDePasse")}
              error={errors.nouveauMotDePasse?.message}
            />
            <div className="space-y-1 pt-1">
              <Indicator ok={hasMinLength} label="Au moins 6 caractères" />
              <Indicator ok={hasUpperCase} label="Une majuscule" />
              <Indicator ok={hasNumber} label="Un chiffre" />
            </div>
          </div>

          {/* Confirmation */}
          <PasswordField
            id="confirm"
            label="Confirmer le mot de passe"
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            registration={register("confirmerMotDePasse")}
            error={errors.confirmerMotDePasse?.message}
          />

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Modification du mot de passe
              </span>
            ) : (
              "Modifier le mot de passe"
            )}
          </button>

          <Link
            to="/profil"
            className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Retour au profil
          </Link>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  id, label, show, onToggle, registration, error,
}: {
  id: string;
  label: string;
  show: boolean;
  onToggle: () => void;
  registration: object;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Lock size={18} className="text-gray-400" />
        </div>
        <input
          id={id}
          type={show ? "text" : "password"}
          {...registration}
          placeholder="••••••••"
          className={`block w-full rounded-lg border ${error ? "border-red-300" : "border-gray-300"} py-3 pl-10 pr-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function Indicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
      {ok ? <CheckCircle2 size={12} /> : <div className="h-3 w-3 rounded-full border border-current" />}
      <span>{label}</span>
    </div>
  );
}
