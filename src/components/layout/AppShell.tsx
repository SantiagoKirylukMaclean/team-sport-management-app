import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="h-full flex">
      <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(v=>!v)} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
