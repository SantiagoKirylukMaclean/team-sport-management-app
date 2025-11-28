import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ModeToggle } from "../ModeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";

export function Header({ right }: { right?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold">{t('header.title')}</h1>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
        {right}
      </div>
    </header>
  );
}
