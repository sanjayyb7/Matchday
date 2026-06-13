"use client";

import { AuthProvider } from "@/lib/auth/context";
import { RealtimeProvider } from "@/lib/realtime/context";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RealtimeProvider>{children}</RealtimeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
