import Modal from "./Modal";

export default function ConfirmDialog({ title = "Are you sure?", message, confirmText = "Delete", onConfirm, onCancel, busy }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="form-actions">
        <button className="btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Working..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
