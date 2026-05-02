import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCameraRotate } from "@fortawesome/free-solid-svg-icons";

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const readerRef  = useRef<BrowserMultiFormatReader | null>(null);
  const [cameras, setCameras]     = useState<MediaDeviceInfo[]>([]);
  const [camIndex, setCamIndex]   = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const [scanning, setScanning]   = useState(true);

  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => setCameras(devices))
      .catch(() => setError("Impossible d'accéder aux caméras"));
  }, []);

  useEffect(() => {
    if (!scanning || cameras.length === 0 || !videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    const deviceId = cameras[camIndex]?.deviceId;

    reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
      if (result) {
        setScanning(false);
        onResult(result.getText());
      }
      if (err && !(err instanceof NotFoundException)) {
        setError("Erreur de lecture : " + err.message);
      }
    }).catch((e) => setError("Caméra inaccessible : " + e.message));

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [scanning, cameras, camIndex, onResult]);

  function switchCamera() {
    BrowserMultiFormatReader.releaseAllStreams();
    setScanning(false);
    setTimeout(() => {
      setCamIndex((i) => (i + 1) % cameras.length);
      setScanning(true);
    }, 100);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold text-sm">Scanner un code-barres / QR code</h3>
          <button onClick={onClose} className="text-text-3 hover:text-text-1">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 16 }} />
          </button>
        </div>

        <div className="relative bg-black">
          <video ref={videoRef} className="w-full" style={{ height: 280, objectFit: "cover" }} />
          {/* Viseur */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-64 rounded-lg border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        </div>

        <div className="px-4 py-3 space-y-2">
          {error ? (
            <p className="text-xs text-danger text-center">{error}</p>
          ) : scanning ? (
            <p className="text-xs text-text-2 text-center animate-pulse">
              Pointez la caméra vers le code-barres ou QR code…
            </p>
          ) : (
            <p className="text-xs text-success text-center font-medium">✓ Code détecté</p>
          )}

          <div className="flex gap-2">
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm text-text-2 hover:bg-surface"
              >
                <FontAwesomeIcon icon={faCameraRotate} style={{ fontSize: 14 }} />
                Changer de caméra
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm text-text-2 hover:bg-surface"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
