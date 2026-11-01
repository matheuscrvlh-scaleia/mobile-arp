import { StyleSheet, View } from "react-native";
import { Sheet } from "./Sheet";
import { Toast } from "./Toast";

/** Monte uma vez no layout raiz, depois do navegador (dentro do GestureHandlerRootView e do
    SafeAreaProvider). Desenha o painel e o aviso por cima de todas as telas. */
export function OverlayHost() {
  return (
    <View style={styles.host}>
      <Sheet />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  host: { ...StyleSheet.absoluteFill, zIndex: 1000, pointerEvents: "box-none" },
});
