"use client";

import { useSyncExternalStore } from "react";

const nada = () => () => {};

// false no servidor e enquanto o JavaScript da página não carregou; true depois.
// Serve para não mostrar controles que só funcionam com JavaScript (ex.: "Mostrar" senha)
// antes de eles funcionarem: um clique nesse intervalo se perderia.
export function useHidratado(): boolean {
  return useSyncExternalStore(nada, () => true, () => false);
}
