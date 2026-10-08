// Small reusable UI pieces for loading / error / empty states.
export function Loader({ text = "Loading..." }) {
  return (
    <div className="state-box" role="status">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", text, children }) {
  return (
    <div className="state-box">
      <div className="empty-icon">📭</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
