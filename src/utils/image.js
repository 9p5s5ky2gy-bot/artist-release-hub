function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    image.src = src;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível converter a imagem.'));
    reader.readAsDataURL(blob);
  });
}

export async function optimizeImageFile(file, options = {}) {
  const maxSize = options.maxSize || 800;
  const quality = options.quality || 0.78;

  if (!file?.type?.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);

    const webpBlob = await canvasToBlob(canvas, 'image/webp', quality);
    const blob = webpBlob || (await canvasToBlob(canvas, 'image/jpeg', quality));

    if (!blob) throw new Error('Não foi possível otimizar a imagem.');

    return {
      dataUrl: await readBlobAsDataUrl(blob),
      width,
      height,
      size: blob.size,
      type: blob.type,
      originalName: file.name,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
