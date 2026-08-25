/* ================================================================== */
/*  Image crop-upload workflow:                                        */
/*  select file -> validate -> zoom/pan crop at a fixed aspect ratio   */
/*  -> preview -> export an optimized image (data URL in local mode,   */
/*  Supabase Storage URL when the Supabase backend is configured).     */
/* ================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./ui";
import { IconX, IconCheck } from "../icons";

export const ASPECTS = { card: 16 / 10, hero: 16 / 9, square: 1 };

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Downscale + JPEG-compress so localStorage/DB stays lean. */
export function optimizeImage(img: HTMLImageElement, crop: { x: number; y: number; w: number; h: number }, maxW = 1100): string {
  const scale = Math.min(1, maxW / crop.w);
  const cw = Math.round(crop.w * scale);
  const ch = Math.round(crop.h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, cw, ch);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function ImageCropper({
  aspect = ASPECTS.card,
  onConfirm,
  onClose,
  title = "Crop image",
}: {
  aspect?: number;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
  title?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [stage, setStage] = useState({ w: 480, h: 300 });
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<null | { sx: number; sy: number; ox: number; oy: number }>(null);

  /* measure stage */
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setStage({ w: r.width, h: r.width / aspect });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [aspect]);

  const clampOffset = useCallback(
    (o: { x: number; y: number }, z: number, im: HTMLImageElement, st: { w: number; h: number }) => {
      const scale = Math.max(st.w / im.width, st.h / im.height);
      const dw = im.width * scale * z;
      const dh = im.height * scale * z;
      const minX = st.w - dw;
      const minY = st.h - dh;
      return {
        x: minX >= 0 ? (st.w - dw) / 2 : Math.min(0, Math.max(minX, o.x)),
        y: minY >= 0 ? (st.h - dh) / 2 : Math.min(0, Math.max(minY, o.y)),
      };
    },
    []
  );

  const onFile = async (f: File | undefined) => {
    setError("");
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) {
      setError("Please choose a PNG, JPG or WebP image.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Image is too large — maximum size is 8 MB.");
      return;
    }
    try {
      const url = await readFileAsDataURL(f);
      const image = await loadImage(url);
      imgRef.current = image;
      setImg(image);
      setFileName(f.name);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch {
      setError("Could not read that image. Try a different file.");
    }
  };

  /* pointer pan */
  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({ sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !img) return;
    setOffset(
      clampOffset(
        { x: dragging.ox + (e.clientX - dragging.sx), y: dragging.oy + (e.clientY - dragging.sy) },
        zoom,
        img,
        stage
      )
    );
  };
  const onPointerUp = () => setDragging(null);

  const onZoom = (z: number) => {
    if (!img) return;
    const nz = Math.min(3.5, Math.max(1, z));
    setZoom(nz);
    setOffset((o) => clampOffset(o, nz, img, stage));
  };

  const cropRect = (): { x: number; y: number; w: number; h: number } => {
    if (!img) return { x: 0, y: 0, w: 0, h: 0 };
    const scale = Math.max(stage.w / img.width, stage.h / img.height) * zoom;
    return {
      x: -offset.x / scale,
      y: -offset.y / scale,
      w: stage.w / scale,
      h: stage.h / scale,
    };
  };

  const confirm = async () => {
    if (!img) return;
    setBusy(true);
    /* small delay so the button state is perceptible */
    await new Promise((r) => setTimeout(r, 250));
    const out = optimizeImage(img, cropRect());
    setBusy(false);
    onConfirm(out);
  };

  const scale = img ? Math.max(stage.w / img.width, stage.h / img.height) * zoom : 1;

  return (
    <Modal open onClose={onClose} title={title} wide>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {!img ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 px-6 py-16 text-center transition-colors hover:border-sky-500 hover:bg-sky-50"
        >
          <span className="font-display text-lg font-extrabold text-ink-900">Choose an image from your device</span>
          <span className="mt-1 text-sm font-semibold text-ink-400">
            JPG, PNG or WebP · up to 8 MB · you'll crop it next
          </span>
          <span className="mt-4 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25">
            Browse files
          </span>
          {error && <span className="mt-3 text-sm font-bold text-rose-600">{error}</span>}
        </button>
      ) : (
        <div>
          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={`relative w-full touch-none select-none overflow-hidden rounded-2xl bg-ink-950 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ height: stage.h }}
          >
            <img
              src={img.src}
              alt="Crop preview"
              draggable={false}
              className="absolute left-0 top-0 max-w-none"
              style={{ width: img.width * scale, height: img.height * scale, transform: `translate(${offset.x}px, ${offset.y}px)` }}
            />
            {/* rule-of-thirds guides */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 w-full h-px bg-white/20" />
              <div className="absolute top-2/3 left-0 w-full h-px bg-white/20" />
              <div className="absolute inset-0 ring-2 ring-inset ring-white/30 rounded-2xl" />
            </div>
            <span className="absolute bottom-2 right-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              drag to reposition
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex min-w-[220px] flex-1 items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Zoom</span>
              <input
                type="range"
                min={1}
                max={3.5}
                step={0.01}
                value={zoom}
                onChange={(e) => onZoom(Number(e.target.value))}
                className="flex-1 accent-sky-500"
                aria-label="Zoom"
              />
              <span className="w-12 text-right font-mono text-xs font-bold text-ink-600">{zoom.toFixed(2)}×</span>
            </div>
            <button onClick={() => fileRef.current?.click()} className="rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-bold text-ink-600 hover:bg-ink-50">
              Choose different file
            </button>
          </div>

          <p className="mt-2 truncate text-xs font-semibold text-ink-400">{fileName}</p>
          {error && <p className="mt-1 text-sm font-bold text-rose-600">{error}</p>}

          <div className="mt-5 flex justify-end gap-2.5">
            <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
              <IconX size={15} /> Cancel
            </button>
            <button
              onClick={confirm}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-60"
            >
              <IconCheck size={15} /> {busy ? "Processing…" : "Use this crop"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
