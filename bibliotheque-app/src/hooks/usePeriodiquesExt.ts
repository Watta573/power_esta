import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { periodiqueExtApi } from "@/api/periodiques-ext.api";

// ── Abonnements ──────────────────────────────────────────────────────────

export function useAbonnementsPeriodiques(params?: { statut?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ["abonnements-periodiques", params],
    queryFn: () => periodiqueExtApi.getAbonnements(params).then((r) => r.data),
  });
}

export function useCreerAbonnementPeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.creerAbonnement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["abonnements-periodiques"] });
      toast.success("Abonnement créé avec succès");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur lors de la création"),
  });
}

export function useAnnulerAbonnementPeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.annulerAbonnement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["abonnements-periodiques"] });
      toast.success("Abonnement annulé");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur"),
  });
}

// ── Emprunts périodiques ─────────────────────────────────────────────────

export function useEmpruntsPeriodiques(params?: { utilisateurId?: number; statut?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ["emprunts-periodiques", params],
    queryFn: () => periodiqueExtApi.getEmprunts(params).then((r) => r.data),
  });
}

export function useCreerEmpruntPeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.creerEmprunt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emprunts-periodiques"] });
      qc.invalidateQueries({ queryKey: ["periodiques"] });
      toast.success("Emprunt périodique enregistré");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur lors de l'emprunt"),
  });
}

export function useRetourPeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.retour,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emprunts-periodiques"] });
      qc.invalidateQueries({ queryKey: ["reservations-periodiques"] });
      qc.invalidateQueries({ queryKey: ["periodiques"] });
      toast.success("Retour enregistré");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur lors du retour"),
  });
}

export function usePayerAmendePeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.payerAmende,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emprunts-periodiques"] });
      toast.success("Amende encaissée — utilisateur notifié");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur"),
  });
}

// ── Réservations périodiques ─────────────────────────────────────────────

export function useReservationsPeriodiques(params?: { utilisateurId?: number; statut?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ["reservations-periodiques", params],
    queryFn: () => periodiqueExtApi.getReservations(params).then((r) => r.data),
  });
}

export function useCreerReservationPeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.creerReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations-periodiques"] });
      toast.success("Réservation périodique enregistrée");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur lors de la réservation"),
  });
}

export function useAnnulerReservationPeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.annulerReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations-periodiques"] });
      toast.success("Réservation annulée");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur"),
  });
}

export function useConfirmerReservationPeriodique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodiqueExtApi.confirmerReservation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations-periodiques"] });
      toast.success("Réservation confirmée");
    },
    onError: (e: AxiosError<{ message: string }>) =>
      toast.error(e.response?.data?.message ?? "Erreur"),
  });
}
