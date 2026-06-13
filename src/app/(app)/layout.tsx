import { AppShell } from "@/components/layout/AppShell";
import { PubSquadSheet } from "@/components/pub/PubSquadSheet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <PubSquadSheet />
    </AppShell>
  );
}
