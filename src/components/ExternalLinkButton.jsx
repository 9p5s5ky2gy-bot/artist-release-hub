import { ExternalLink } from 'lucide-react';

export function ExternalLinkButton({ href, children }) {
  if (!href) return null;

  return (
    <a className="link-button" href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <ExternalLink size={14} />
    </a>
  );
}
