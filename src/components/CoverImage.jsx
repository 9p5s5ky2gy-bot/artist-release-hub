import { Music } from 'lucide-react';

export function CoverImage({ src, alt }) {
  if (!src) {
    return (
      <div className="cover-placeholder">
        <Music size={24} />
      </div>
    );
  }

  return <img className="cover-image" src={src} alt={alt} loading="lazy" />;
}
