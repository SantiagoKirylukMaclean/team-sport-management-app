import { type ReactNode } from "react";
import { ModeToggle } from "../ModeToggle";

export function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold">Championship Standings</h1>
      <div className="flex items-center gap-2">
        <ModeToggle />
        {right}
      </div>
    </header>
  );
}
