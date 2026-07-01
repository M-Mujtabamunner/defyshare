import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface InternalLink {
  label: string;
  href: string;
  description: string;
}

interface InternalLinksProps {
  links: InternalLink[];
  title?: string;
}

export const InternalLinks = ({
  links,
  title = 'Related Guides',
}: InternalLinksProps) => {
  return (
    <div className="mt-10">
      <h3 className="text-base font-semibold text-zinc-200 mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-violet-500/40 hover:bg-violet-950/20 transition-all"
          >
            <ArrowRight className="w-4 h-4 text-violet-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <div>
              <p className="text-sm font-medium text-zinc-200 group-hover:text-violet-300 transition-colors">
                {link.label}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
