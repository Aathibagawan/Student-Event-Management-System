import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

/**
 * Camera QR scanner using the `html5-qrcode` package.
 * Calls onScan(text) for each decoded code. Duplicate reads of the same code within
 * 3 seconds are ignored (the camera decodes many frames per second).
 */
export default function QRScanner({ onScan }) {
  const lastRef = useRef({ text: "", at: 0 });
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 240, height: 240 } }, false);
    scanner.render(
      (text) => {
        const now = Date.now();
        if (text === lastRef.current.text && now - lastRef.current.at < 3000) return;
        lastRef.current = { text, at: now };
        onScanRef.current(text);
      },
      () => {} // ignore "no QR found in this frame" errors
    );
    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return <div id="qr-reader" className="qr-reader" />;
}
