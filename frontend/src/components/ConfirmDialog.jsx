import Modal from "./Modal";

export default function ConfirmDialog({ title = "Are you sure?", message, confirmText = "Delete", onConfirm, onCancel, busy }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? "Working..." : confirmText}</button>
      </div>
    </Modal>
  );
}
