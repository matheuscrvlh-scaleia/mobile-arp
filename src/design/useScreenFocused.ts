import { NavigationContext } from "expo-router/react-navigation";
import { use, useCallback, useSyncExternalStore } from "react";

const noop = () => {};

/**
 * A tela onde o componente está tem o foco? Para pausar animações em loop (shimmer, spinner,
 * pulsos) em abas e telas da pilha que ficaram por baixo.
 *
 * Diferente do `useIsFocused` do expo-router, não quebra fora da árvore de rotas (painéis e
 * avisos do OverlayHost): lá conta como focado.
 */
export function useScreenFocused(): boolean {
  const navigation = use(NavigationContext);
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!navigation) return noop;
      const offFocus = navigation.addListener("focus", onChange);
      const offBlur = navigation.addListener("blur", onChange);
      return () => {
        offFocus();
        offBlur();
      };
    },
    [navigation],
  );
  const getSnapshot = useCallback(() => (navigation ? navigation.isFocused() : true), [navigation]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
