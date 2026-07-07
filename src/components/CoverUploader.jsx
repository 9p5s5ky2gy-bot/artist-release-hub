import { ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { optimizeImageFile } from '../utils/image';
import { getReleaseCover } from '../utils/release';
import { CoverImage } from './CoverImage';

export function CoverUploader({ release, onChange }) {
  const [status, setStatus] = useState('');
  const cover = getReleaseCover(release);

  function updateUrl(event) {
    const value = event.target.value;
    onChange({
      coverUrl: value,
      coverImageUrl: value,
      coverImage: value ? '' : release.coverImage,
      coverImageMeta: value ? null : release.coverImageMeta,
    });
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Otimizando imagem...');

    try {
      const optimized = await optimizeImageFile(file);
      onChange({
        coverImage: optimized.dataUrl,
        coverImageMeta: {
          width: optimized.width,
          height: optimized.height,
          size: optimized.size,
          type: optimized.type,
          originalName: optimized.originalName,
        },
        coverUrl: '',
        coverImageUrl: '',
      });
      setStatus(`Capa otimizada em ${optimized.width}x${optimized.height}px.`);
    } catch (error) {
      setStatus(error.message || 'Não foi possível carregar a imagem.');
    } finally {
      event.target.value = '';
    }
  }

  function removeCover() {
    onChange({
      coverUrl: '',
      coverImageUrl: '',
      coverImage: '',
      coverImageMeta: null,
    });
    setStatus('Capa removida.');
  }

  return (
    <section className="cover-uploader">
      <div className="cover-preview">
        <CoverImage src={cover} alt={release.songTitle || 'Capa do lançamento'} />
      </div>

      <div className="cover-uploader-fields">
        <label>
          URL da capa
          <span className="input-with-icon">
            <Link2 size={16} />
            <input value={release.coverUrl || release.coverImageUrl || ''} onChange={updateUrl} placeholder="https://..." />
          </span>
        </label>

        <label className="upload-dropzone">
          <Upload size={17} />
          <span>Enviar imagem do computador/celular</span>
          <input accept="image/*" onChange={uploadFile} type="file" />
        </label>

        {cover && (
          <button className="secondary-button compact" onClick={removeCover} type="button">
            <Trash2 size={15} />
            <span>Remover capa</span>
          </button>
        )}

        <div className="cover-hint">
          <ImagePlus size={16} />
          <span>{status || 'Upload é salvo como imagem otimizada dentro do JSON do workspace.'}</span>
        </div>
      </div>
    </section>
  );
}
