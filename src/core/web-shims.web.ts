import { Linking } from "react-native";

/*
 * Web (react-native-web): APIs do RN que não existem lá e o app chama em
 * botões ("Abrir ajustes" de câmera, galeria e notificações). Sem isto o
 * clique lança TypeError; aqui vira no-op.
 */
const linking = Linking as { openSettings?: () => Promise<void> };
if (typeof linking.openSettings !== "function") {
  linking.openSettings = () => Promise.resolve();
}
