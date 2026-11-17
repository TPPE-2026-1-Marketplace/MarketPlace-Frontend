import { api } from "@/lib/api";

interface UploadedImageResponse {
  idImagem: number;
  url?: string;
}

/** Lê um arquivo de imagem selecionado localmente e devolve uma data URL. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
}

/**
 * Converte uma data URL recortada em arquivo e envia para `/images/upload`
 * (que hospeda no ImgBB via backend) retornando a URL pública gerada.
 */
export async function uploadBannerImageDataUrl(
  dataUrl: string,
  options?: { descricao?: string; ordem?: number },
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const formData = new FormData();
  formData.append(
    "file",
    new File([blob], "banner.jpg", { type: blob.type || "image/jpeg" }),
  );
  formData.append("ordem", String(options?.ordem ?? 0));
  formData.append("local_renderizacao", "banner");

  const trimmedDescription = options?.descricao?.trim().slice(0, 255);
  if (trimmedDescription) {
    formData.append("descricao", trimmedDescription);
  }

  const uploaded = await api.post<UploadedImageResponse>("/images/upload", formData);
  const uploadedUrl = uploaded?.url?.trim();
  if (!uploadedUrl) {
    throw new Error("O servidor não retornou a URL da imagem enviada.");
  }

  return uploadedUrl;
}
