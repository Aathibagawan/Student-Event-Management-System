import { useEffect, useState } from "react";
import { registrationService } from "../services/endpoints";

/** Loads the QR PNG through the authenticated API and shows it as an <img>. */
export default function QRImage({ registrationPk, registrationId }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = "";
    registrationService
      .qrBlobUrl(registrationPk)
      .then((u) => {
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => setFailed(true));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [registrationPk]);

  if (failed) return <p className="alert alert-error">Could not load QR code.</p>;
  if (!url) return <p className="muted">Loading QR...</p>;
  return (
    <div className="qr-box">
      <img src={url} alt={`QR code for ${registrationId}`} width="240" height="240" />
      <a className="btn btn-sm" href={url} download={`${registrationId}.png`}>Download QR</a>
    </div>
  );
}
