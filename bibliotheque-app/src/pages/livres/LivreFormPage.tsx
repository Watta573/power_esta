import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { livresApi } from "@/api/livres.api";
import { categoriesApi } from "@/api/categories.api";
import { languesApi } from "@/api/langues.api";
import { couvertureUrl } from "@/lib/imageUrl";
import { useT } from "@/stores/i18n.store";

const livreSchema = z.object({
  titre: z.string().min(1, "Titre requis"),
  auteur: z.string().min(1, "Auteur requis"),
  isbn: z.string().min(10, "ISBN invalide"),
  editeur: z.string().min(1, "Editeur requis"),
  edition: z.string().min(1, "Edition requise"),
  anneePublication: z.number().int().min(1800).max(new Date().getFullYear() + 1),
  categorieId: z.number().int().positive("Catégorie requise"),
  langue: z.string().min(1, "Langue requise"),
  description: z.string().min(1, "Description requise"),
  nombrePages: z.number().int().min(1).optional(),
  nombreExemplaires: z.number().int().min(1).max(100).optional(),
  disponible: z.boolean().optional(),
});

type LivreForm = z.infer<typeof livreSchema>;

export default function LivreFormPage() {
  const t = useT();
  const tf = t.livreForm;
  const { id } = useParams();
  const isEdit = Boolean(id);
  const livreId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [couvertureFile, setCouvertureFile] = useState<File | null>(null);
  const [couverturePreview, setCouverturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: livreExistant } = useQuery({
    queryKey: ["livre", livreId],
    queryFn: () => livresApi.getById(livreId).then((r) => r.data),
    enabled: isEdit && Number.isFinite(livreId),
  });

  function handleCouvertureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Fichier invalide. Seules les images sont acceptées."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image trop lourde. Maximum 2 Mo."); return; }
    setCouvertureFile(file);
    setCouverturePreview(URL.createObjectURL(file));
  }

  function removeCouverture() {
    setCouvertureFile(null);
    setCouverturePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });
  const { data: langues } = useQuery({
    queryKey: ["langues"],
    queryFn: () => languesApi.getAll().then((r) => r.data),
  });
  const { register, handleSubmit, formState, reset } = useForm<LivreForm>({
    resolver: zodResolver(livreSchema),
  });

  useEffect(() => {
    if (livreExistant) {
      reset({
        titre: livreExistant.titre,
        auteur: livreExistant.auteur,
        isbn: livreExistant.isbn,
        editeur: livreExistant.editeur,
        edition: livreExistant.edition,
        anneePublication: livreExistant.anneePublication,
        categorieId: livreExistant.categorie?.id,
        langue: livreExistant.langue,
        description: livreExistant.description,
      });
      if (livreExistant.couverture) {
        setCouverturePreview(couvertureUrl(livreExistant.couverture));
      }
    }
  }, [livreExistant, reset]);

  const mutation = useMutation({
    mutationFn: (values: LivreForm) => {
      if (isEdit) {
        return livresApi.update(livreId, {
          titre: values.titre,
          auteur: values.auteur,
          isbn: values.isbn,
          editeur: values.editeur,
          edition: values.edition,
          anneePublication: values.anneePublication,
          categorie: { id: values.categorieId } as any,
          langue: values.langue,
          description: values.description,
        });
      }
      const formData = new FormData();
      formData.append("titre", values.titre);
      formData.append("isbn", values.isbn);
      formData.append("auteur", values.auteur);
      formData.append("editeur", values.editeur);
      formData.append("edition", values.edition);
      formData.append("anneePublication", String(values.anneePublication));
      formData.append("categorieId", String(values.categorieId));
      formData.append("langue", values.langue);
      formData.append("description", values.description);
      if (values.nombrePages) formData.append("nombrePages", String(values.nombrePages));
      if (values.nombreExemplaires) formData.append("nombreExemplaires", String(values.nombreExemplaires));
      if (couvertureFile) formData.append("couverture", couvertureFile);
      return livresApi.create(formData);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["livres"] });
      toast.success(isEdit ? "Livre modifié avec succès" : "Livre ajouté avec succès");
      navigate(isEdit ? `/livres/${livreId}` : "/livres");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement du livre"),
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4 rounded-md border border-border bg-white p-6 shadow-soft">
      <h1 className="font-heading text-2xl">{isEdit ? tf.modifierLivre : tf.ajouterLivre}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <input {...register("titre")} placeholder={tf.titre} className="h-11 rounded-md border border-border px-3" />
        <input {...register("auteur")} placeholder={tf.auteur} className="h-11 rounded-md border border-border px-3" />
        <input {...register("isbn")} placeholder={tf.isbn} className="h-11 rounded-md border border-border px-3 font-mono" />
        <input {...register("editeur")} placeholder={tf.editeur} className="h-11 rounded-md border border-border px-3" />
        <input {...register("edition")} placeholder={tf.edition} className="h-11 rounded-md border border-border px-3" />
        <input
          {...register("anneePublication", { valueAsNumber: true })}
          type="number"
          placeholder={tf.anneePublication}
          className="h-11 rounded-md border border-border px-3"
        />
        <input
          {...register("nombrePages", { valueAsNumber: true })}
          type="number"
          placeholder={tf.nombrePages}
          className="h-11 rounded-md border border-border px-3"
        />
        <input
          {...register("nombreExemplaires", { valueAsNumber: true })}
          type="number"
          placeholder={tf.nombreExemplaires}
          min={1}
          max={100}
          className="h-11 rounded-md border border-border px-3"
        />
        {!isEdit && (
          <label className="flex h-11 items-center gap-3 rounded-md border border-border px-3">
            <input type="checkbox" {...register("disponible")} className="h-4 w-4 accent-primary" />
            <span className="text-sm text-text-2">{tf.disponibleCreation}</span>
          </label>
        )}
        <select {...register("categorieId", { valueAsNumber: true })} className="h-11 rounded-md border border-border px-3">
          <option value={0}>{tf.choisirCategorie}</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <select {...register("langue")} className="h-11 rounded-md border border-border px-3">
          <option value="">{tf.choisirLangue}</option>
          {(langues ?? []).map((l) => (
            <option key={l.id} value={l.nom}>{l.nom}</option>
          ))}
        </select>
      </div>
      <textarea {...register("description")} placeholder={tf.description} className="min-h-28 w-full rounded-md border border-border p-3" />

      {/* Couverture */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-2">{tf.couverture}</label>
        <div className="flex items-center gap-4">
          <div className="grid h-32 w-24 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface-2">
            {couverturePreview ? (
              <img src={couverturePreview} alt="Aperçu" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={24} className="text-text-3" />
            )}
          </div>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5">
              <ImagePlus size={14} /> {couvertureFile ? tf.changerImage : tf.choisirImage}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCouvertureChange} />
            </label>
            {couvertureFile && (
              <button type="button" onClick={removeCouverture} className="flex items-center gap-2 rounded-md border border-danger px-3 py-2 text-sm text-danger hover:bg-danger/5">
                <X size={14} /> {tf.supprimerImage}
              </button>
            )}
          </div>
        </div>
      </div>

      {formState.errors.titre && <p className="text-sm text-danger">{formState.errors.titre.message}</p>}
      <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-white">
        {mutation.isPending ? tf.enregistrement : isEdit ? tf.mettreAJour : tf.enregistrer}
      </button>
    </form>
  );
}
