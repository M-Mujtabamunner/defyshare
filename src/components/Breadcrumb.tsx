import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-zinc-400 mb-6 flex-wrap"
    >
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-violet-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-violet-400 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};
