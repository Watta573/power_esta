import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { authApi } from "@/api/auth.api";
import type { Role } from "@/types";
import { AlertCircle } from "lucide-react";

const schema = z.object({
  nom: z.string().min(2, "Nom requis"),
  prenom: z.string().min(2, "Prénom requis"),
  identifiant: z.string().min(3, "Identifiant requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().regex(/^[0-9]{8,15}$/, "Téléphone invalide").or(z.literal("")),
  role: z.enum(["ADMIN", "BIBLIOTHECAIRE", "ETUDIANT", "ENSEIGNANT", "PUBLIC"]),
  motDePasse: z.string().min(6, "Min 6 caractères").regex(/[A-Z]/, "Une majuscule").regex(/[0-9]/, "Un chiffre"),
});

type FormValues = z.infer<typeof schema>;

const ROLES: { value: Role; label: string }[] = [
  { value: "ETUDIANT", label: "Étudiant" },
  { value: "ENSEIGNANT", label: "Enseignant" },
  { value: "BIBLIOTHECAIRE", label: "Bibliothécaire" },
  { value: "PUBLIC", label: "Public" },
  { value: "ADMIN", label: "Administrateur" },
];

export default function UtilisateurFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "ETUDIANT" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authApi.register({ ...values, confirmerMotDePasse: values.motDePasse }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      toast.success("Utilisateur créé avec succès");
      navigate("/utilisateurs");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Erreur lors de la création"),
  });

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Nouvel utilisateur</h1>
        <p className="text-sm text-text-2">Créer un nouveau compte adhérent ou membre du personnel</p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="space-y-5 rounded-xl border border-border bg-white p-6 shadow-sm">

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            { name: "nom", label: "Nom", placeholder: "Dupont" },
            { name: "prenom", label: "Prénom", placeholder: "Jean" },
            { name: "identifiant", label: "Identifiant", placeholder: "jdupont" },
            { name: "email", label: "Email", placeholder: "jean@esta.edu" },
            { name: "telephone", label: "Téléphone", placeholder: "0612345678" },
          ] as Array<{ name: keyof FormValues; label: string; placeholder: string }>).map(({ name, label, placeholder }) => (
            <div key={name} className="space-y-1">
              <label className="text-sm font-medium text-text-2">{label}</label>
              <input {...register(name)} type={name === "email" ? "email" : "text"} placeholder={placeholder}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${errors[name] ? "border-red-300" : "border-border"}`} />
              {errors[name] && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <AlertCircle size={11} />{errors[name]?.message}
                </p>
              )}
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-2">Rôle</label>
            <select {...register("role")}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-2">Mot de passe initial</label>
          <input {...register("motDePasse")} type="password" placeholder="••••••••"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${errors.motDePasse ? "border-red-300" : "border-border"}`} />
          {errors.motDePasse && (
            <p className="flex items-center gap-1 text-xs text-danger">
              <AlertCircle size={11} />{errors.motDePasse.message}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-60">
            {mutation.isPending ? "Création..." : "Créer l'utilisateur"}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="rounded-lg border border-border px-5 py-2 text-sm text-text-2 hover:bg-surface">
            Annuler
          </button>
        </div>
      </form>
    </section>
  );
}
