import React from 'react';
import { Check, Languages } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import HeaderButton from '@/components/HeaderButton';
import { LANGUAGES, useT } from '@/lib/i18n';

/** Language switcher; the choice is saved on this device. */
const LanguageMenu: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang, t } = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('language')} className={className}>
          <Languages className="w-[18px] h-[18px]" />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="justify-between">
            <span>{l.label}</span>
            {l.code === lang && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageMenu;
