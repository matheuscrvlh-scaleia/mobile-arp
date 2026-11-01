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
        Pague o estacionamento pelo app e ganhe o selo <Bold>Sem Fila</Bold> no mesmo instante. A
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

export function openTourSheet(): void {
  sheet.open(({ closeThen }) => (
    <>
      <SheetIcon name="compass" background="brand" />
      <SheetTitle>Tour da ARP</SheetTitle>
      <SheetText>
        Um passeio de 40 minutos pela história da fábrica, os blocos e a praça. No fim, leia o QR
        Code e ganhe o selo <Bold>Explorador</Bold>.
      </SheetText>
      <SheetActions>
        <Button
          label="Ver ponto de início no mapa"
          iconLeft="flag"
          variant="dark"
          onPress={closeThen(() => openPath("/mapa"))}
        />
        <Button
          label="Ver todos os desafios"
          variant="soft"
          onPress={closeThen(() => openPath("/desafios"))}
        />
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
