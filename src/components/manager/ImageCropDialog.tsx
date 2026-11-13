import { useEffect, useRef, useState, type PointerEvent } from "react";
import Button from "@/components/ui/Button";
import WideDialog from "./WideDialog";
import { adminButtonClassName } from "./adminClasses";

/** Moldura 3:4 do protótipo (282 × 376 dentro da área de 442px). */
const FRAME_WIDTH = 282;
const FRAME_HEIGHT = 376;
/** Tamanho final da foto recortada (3:4). */
const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 1200;
const MIN_ZOOM = 100;
const MAX_ZOOM = 300;
const ZOOM_STEP = 10;

interface Size {
  width: number;
  height: number;
}

interface Offset {
  x: number;
  y: number;
}

/** Escala que faz a imagem cobrir a moldura em zoom 100%. */
const coverScale = ({ width, height }: Size) => Math.max(FRAME_WIDTH / width, FRAME_HEIGHT / height);

/** Mantém a imagem cobrindo a moldura inteira. */
function clampOffset(offset: Offset, natural: Size, zoom: number): Offset {
  const scale = coverScale(natural) * (zoom / 100);
  const minX = FRAME_WIDTH - natural.width * scale;
  const minY = FRAME_HEIGHT - natural.height * scale;
  return { x: Math.min(0, Math.max(minX, offset.x)), y: Math.min(0, Math.max(minY, offset.y)) };
}

function centeredOffset(natural: Size, zoom: number): Offset {
  const scale = coverScale(natural) * (zoom / 100);
  return { x: (FRAME_WIDTH - natural.width * scale) / 2, y: (FRAME_HEIGHT - natural.height * scale) / 2 };
}

interface ImageCropDialogProps {
  /** Imagem a recortar (data URL ou URL pública); null fecha o dialog. */
  src: string | null;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

/** Frame "Produto / Recortar imagem" (764:14786): proporção fixa 3:4, zoom e enquadramento. */
export default function ImageCropDialog(props: ImageCropDialogProps) {
  return <ImageCropContent key={props.src ?? "fechado"} {...props} />;
}

function ImageCropContent({ src, onClose, onApply }: ImageCropDialogProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origin: Offset } | null>(null);
  const [natural, setNatural] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    const image = new Image();
    // Links externos precisam de CORS para o canvas exportar o recorte.
    if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      setNatural(size);
      setOffset(centeredOffset(size, MIN_ZOOM));
    };
    image.onerror = () => setError("Não foi possível carregar esta imagem para recorte.");
    image.src = src;
  }, [src]);

  const changeZoom = (next: number) => {
    const value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    if (!natural) {
      setZoom(value);
      return;
    }
    // Mantém o centro da moldura no mesmo ponto da foto ao aproximar ou afastar.
    const ratio = value / zoom;
    const centerX = FRAME_WIDTH / 2;
    const centerY = FRAME_HEIGHT / 2;
    setOffset(
      clampOffset(
        { x: centerX - (centerX - offset.x) * ratio, y: centerY - (centerY - offset.y) * ratio },
        natural,
        value,
      ),
    );
    setZoom(value);
  };

  const reset = () => {
    setZoom(MIN_ZOOM);
    if (natural) setOffset(centeredOffset(natural, MIN_ZOOM));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, origin: offset };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !natural) return;
    setOffset(
      clampOffset(
        { x: drag.origin.x + event.clientX - drag.startX, y: drag.origin.y + event.clientY - drag.startY },
        natural,
        zoom,
      ),
    );
  };

  const apply = () => {
    const image = imageRef.current;
    if (!image || !natural) return;
    const scale = coverScale(natural) * (zoom / 100);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext("2d");
    try {
      if (!context) throw new Error("Canvas indisponível");
      // "0 -" evita -0 quando a foto está encostada na borda da moldura.
      context.drawImage(
        image,
        0 - offset.x / scale,
        0 - offset.y / scale,
        FRAME_WIDTH / scale,
        FRAME_HEIGHT / scale,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
      );
      onApply(canvas.toDataURL("image/jpeg", 0.9));
    } catch (cropError) {
      console.error(cropError);
      setError("Não foi possível recortar esta imagem. Envie o arquivo pelo computador e tente de novo.");
    }
  };

  const scale = natural ? coverScale(natural) * (zoom / 100) : 1;

  return (
    <WideDialog
      open={src !== null}
      onClose={onClose}
      title="Recortar imagem"
      footer={
        <>
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="action"
            size="sm"
            className={`${adminButtonClassName} md:min-w-[220px]`}
            disabled={!natural}
            onClick={apply}
          >
            Aplicar recorte
          </Button>
        </>
      }
    >
      <p className="text-sm leading-[21px] text-[var(--foreground-muted)]">Arraste a foto para ajustar o enquadramento.</p>
      {error && (
        <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
          {error}
        </p>
      )}
      <div className="flex h-[442px] w-full items-center justify-center overflow-hidden rounded-[8px] bg-[var(--action-primary)]">
        <div
          data-testid="crop-frame"
          className="relative cursor-grab touch-none active:cursor-grabbing"
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragRef.current = null)}
          onPointerCancel={() => (dragRef.current = null)}
        >
          {src && natural && (
            <img
              src={src}
              alt="Foto em ajuste"
              draggable={false}
              className="pointer-events-none absolute top-0 left-0 max-w-none select-none"
              style={{
                width: natural.width * scale,
                height: natural.height * scale,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          {/* Máscara escura fora da moldura e guias de terços, como no protótipo. */}
          <div className="pointer-events-none absolute inset-0 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.58)]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/60" />
          <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/60" />
          <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/60" />
          <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/60" />
        </div>
      </div>
      <div className="flex items-start justify-between text-xs leading-[18px] text-[var(--foreground-muted)]">
        <span className="font-medium">Proporção fixa 3:4</span>
        <span>Zoom {zoom}%</span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline-neutral"
          size="sm"
          className="size-12 shrink-0 rounded-[var(--radius-sm)] border border-[var(--border-control)]"
          aria-label="Diminuir zoom"
          onClick={() => changeZoom(zoom - ZOOM_STEP)}
        >
          −
        </Button>
        <input
          type="range"
          aria-label="Zoom da imagem"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(event) => changeZoom(Number(event.target.value))}
          className="h-11 min-w-0 flex-1 accent-[var(--action-primary)]"
        />
        <Button
          variant="outline-neutral"
          size="sm"
          className="size-12 shrink-0 rounded-[var(--radius-sm)] border border-[var(--border-control)]"
          aria-label="Aumentar zoom"
          onClick={() => changeZoom(zoom + ZOOM_STEP)}
        >
          +
        </Button>
      </div>
      <button
        type="button"
        onClick={reset}
        className="self-start text-[13px] leading-5 font-medium text-[var(--color-brand)] hover:underline"
      >
        Redefinir enquadramento
      </button>
    </WideDialog>
  );
}
