"use client";

import * as React from "react";

/** Evita hydration mismatch en componentes que dependen del cliente (p. ej. tema). */
export function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
