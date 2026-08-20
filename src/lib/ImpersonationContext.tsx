'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface ImpersonationContextValue {
  impersonating: boolean;
  /** Best available label for the target - never a raw email; see personLabel(). */
  targetLabel: string | null;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  impersonating: false,
  targetLabel: null,
});

/**
 * Makes "is this browser currently impersonating" available to any client
 * component without threading a prop through every layer (#250 follow-up).
 *
 * Reads the same getImpersonationMeta() cookie RootLayout already reads for
 * the banner/ring/title - this is not a second source of truth, just a way
 * to hand that one server-side read to client components that need it to
 * disable write affordances. The server is still the real enforcement (every
 * write is refused 403 regardless of what this renders); this exists so an
 * admin never believes a click succeeded before the refusal lands.
 */
export function ImpersonationProvider({
  impersonating,
  targetLabel,
  children,
}: ImpersonationContextValue & { children: ReactNode }) {
  return (
    <ImpersonationContext.Provider value={{ impersonating, targetLabel }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation(): ImpersonationContextValue {
  return useContext(ImpersonationContext);
}
