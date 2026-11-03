import { StyleSheet } from "react-native";
import { Button, SheetActions, SheetIcon, SheetText, SheetTitle, sheet, Text } from "@/design";
import { openPath } from "@/navigation/navigate";

/* Painéis dos atalhos Estacionar e Tour (ACTIONS.parking / ACTIONS.tour do protótipo). */

export function openParkingSheet(): void {
  sheet.open(({ close, closeThen }) => (
    <>
      {/* fundo escuro fixo: o ícone verde não some no tema escuro (inverse ficaria claro) */}
      <SheetIcon name="car" background="chrome" color="brand" />
      <SheetTitle>Estacionamento</SheetTitle>
      <SheetText>
        Pague o estacionamento pelo app e ganhe o selo <Bold>Passe Livre</Bold> no mesmo instante. A
        integração com o sistema do estacionamento ainda será definida.
      </SheetText>
      <SheetActions>
        <Button
          label="Ver no mapa"
          iconLeft="map"
          variant="dark"
          onPress={closeThen(() => openPath("/mapa"))}
        />
        <Button label="Agora não" variant="soft" onPress={close} />
      </SheetActions>
    </>
  ));
}

function Bold({ children }: { children: string }) {
  return (
    <Text variant="muted" weight={700} style={styles.bold}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: { lineHeight: 22 },
});
