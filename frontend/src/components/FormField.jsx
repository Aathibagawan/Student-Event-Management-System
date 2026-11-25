import { useId } from "react";

/**
 * Reusable form control: label + input/select/textarea + error message.
 * <FormField label="Email" name="email" value={...} onChange={...} error={errors.email} />
 * <FormField as="select" ...>{options}</FormField>
 */
export default function FormField({ label, error, as: Tag = "input", className = "", children, ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <Tag id={id} aria-invalid={Boolean(error)} className={`input ${error ? "input-error" : ""}`} {...props}>
        {children}
      </Tag>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
