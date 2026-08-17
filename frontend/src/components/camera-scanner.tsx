"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

const CONTAINER_ID = "qr-reader";

export function CameraScanner({
  active,
  onScan,
}: {
  active: boolean;
  onScan: (code: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(CONTAINER_ID);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText) => onScanRef.current(decodedText),
          () => {
            // sem QR no frame atual — chamado o tempo todo, ignorar
          },
        )
        .catch(() => {
          setError("Não foi possível acessar a câmera. Use a digitação manual.");
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div id={CONTAINER_ID} className="w-full max-w-xs overflow-hidden rounded" />
      {error && <p className="text-sm text-red">{error}</p>}
    </div>
  );
}
