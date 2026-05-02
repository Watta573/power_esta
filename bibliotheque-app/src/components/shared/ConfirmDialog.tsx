import * as Dialog from "@radix-ui/react-dialog";
import { useT } from "@/stores/i18n.store";

interface ConfirmDialogProps {
  open: boolean;
  titre: string;
  message: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, titre, message, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const t = useT();
  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-white p-5 shadow-soft">
          <Dialog.Title className="font-heading text-xl">{titre}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-text-2">{message}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm">
              {t.confirmDialog.annuler}
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-md px-4 py-2 text-sm text-white ${danger ? "bg-danger" : "bg-primary"}`}
            >
              {t.confirmDialog.confirmer}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
