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
      <h3 className="text-base font-semibold text-foreground/90 mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card/80 p-4 hover:border-primary/40 hover:bg-primary/10 transition-all"
          >
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <div>
              <p className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors">
                {link.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
