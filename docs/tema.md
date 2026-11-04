# Tema (claro e escuro)

O app abre no tema claro. O visitante pode trocar em Perfil > Aparência (Automático / Claro / Escuro).
Toda cor vem de uma **paleta semântica** (`src/design/theme/palettes.ts`): o nome diz o
*papel* da cor (`text`, `surface`, `inverse`…), não o valor (`ink`, `white`, `card`).

| Arquivo | O que tem |
|---|---|
| `design/theme/palettes.ts` | `lightPalette` (valores do protótipo), `darkPalette`, tons, gradientes, sombras |
| `design/theme/theme.ts` | `themes.light` / `themes.dark` (objetos fixos), `resolveColor` |
| `design/theme/ThemeProvider.tsx` | `ThemeProvider`, `useTheme()`, `useColors()` |
| `design/theme/createStyles.ts` | `createStyles((t) => ({...}))` → hook `useStyles()` |
| `design/theme/preference.ts` | `useThemePreference()`, `setThemePreference()` |
| `design/theme/contrast.ts` | `contrastRatio(fg, bg)` (WCAG) |
| `navigation/NavigationTheme.tsx` | tema do React Navigation acompanhando o do app |

Tudo sai por `@/design`.

## Como usar

### `createStyles` (o padrão)

Troca o `StyleSheet.create` de módulo. A folha de cada tema é criada **uma vez** (na primeira
vez que é pedida) e fica em cache: o hook custa uma leitura de contexto e devolve sempre a mesma
referência enquanto o tema não muda. Serve em item de lista, `memo` e React Compiler.

```tsx
import { createStyles, Text } from "@/design";

export function StoreRow() {
  const styles = useStyles();
  return <View style={styles.row}>…</View>;
}

const useStyles = createStyles((t) => ({
  row: { backgroundColor: t.colors.surface, borderColor: t.colors.border, ...t.shadows.hairline },
  // dá para decidir por tema dentro da fábrica
  handle: { backgroundColor: t.dark ? t.colors.borderStrong : t.colors.border },
}));
```

- `t` = `{ scheme, dark, colors, tones, toneOf, gradients, shadows }`.
- Declare no **módulo** (nunca dentro do componente). Estilo que não depende de cor pode
  continuar num `StyleSheet.create` comum.
- Valor que muda por item (largura, raio, cor que vem da API) continua inline, como hoje.

### `useColors()` / `useTheme()`

Para cor que vai em prop, não em estilo: `<Icon color={colors.textMuted} />`,
`placeholderTextColor`, `colors={[…]}` de gradiente, `interpolateColor` etc.

```tsx
const colors = useColors();
const { dark, toneOf, gradients } = useTheme();
const spec = toneOf(coupon.tone); // fg, fgMuted, barTrack… do tom NO tema atual
```

`Text` e `Icon` já usam o tema: sem `color`, saem em `text`. Prefira `tone` a `color` no Text:
`<Text tone="textMuted">`, `tone="brandText"`, `tone="onChrome"`, `tone="onMedia"`. Os tons
antigos (`ink`, `muted`, `white`, `brand700`, `clay`, `clayInk`, `onDarkMuted`, `ink2`) ainda
funcionam e já mapeiam para o tema.

### Fora do React (sheet, toast)

O `ThemeProvider` fica no `AppProviders` (`core/providers.tsx`), por cima do navegador **e do
`OverlayHost`**. Conteúdo de `sheet.open(...)` e `toast.show(...)` é desenhado dentro do
OverlayHost, então qualquer componente ali dentro usa `useStyles`/`useColors` normalmente.

O que **não** acompanha o tema é uma cor resolvida na hora da chamada. Por isso o
`sheet.message` e o `SheetIcon` aceitam o **nome** da cor, resolvido ao desenhar:

```ts
sheet.message({ icon: "bell", iconBackground: "surface", … });       // ícone sai em `text`
sheet.message({ icon: "car", iconBackground: "inverse", iconColor: "brand", … });
```

Sem `iconColor`, o ícone usa a cor "on" do fundo (`brand → onBrand`, `inverse → onInverse`,
`chrome → onChrome`, `dangerSoft → dangerText`, `brand50/brand100 → brandText`; o resto `text`).

### Preferência do visitante

```tsx
const [pref, setPref] = useThemePreference(); // "system" | "light" | "dark"
<Segmented options={[{ value: "system", label: "Sistema" }, …]} value={pref} onChange={setPref} />
```

- Guardada em `kv` (`pref.theme`) e lida **síncrona** na abertura (`kv.getSync`): o primeiro
  quadro já sai no tema certo.
- Aplicada também no nativo com `Appearance.setColorScheme("light" | "dark" | "unspecified")`
  (RN 0.88; `"unspecified"` volta ao sistema): teclado, alertas, seletores e a status bar
  acompanham.
- O `ThemeProvider` pinta o fundo da janela raiz (`expo-system-ui`) com `bg` a cada troca.
- `app.json`: `userInterfaceStyle: "automatic"`; splash escuro com `logo-escura.png` sobre preto.

### Status bar

`ScreenContainer` tem `statusBar="auto"` por padrão (ícones escuros no claro, claros no
escuro). Use `statusBar="light"` só sobre foto/hero escuro (vale nos dois temas). **Remova**
`statusBar="dark"` das telas comuns (ex.: Home): no tema escuro os ícones sumiriam.
`NavHeader` aceita `statusBar` ("auto" | "light" | "dark") quando a tela não usa ScreenContainer;
sem a prop ele não mexe na status bar. `<StatusBar style="dark">` direto (WelcomeScreen) deve
virar `"auto"` (ou sair).

## Regras

1. **Nunca cor crua** (`"#fff"`, `"rgba(…)"`) nem `colors.*` estático em componente novo. Cor
   da API (gradiente do selo, cor de categoria) é a exceção.
2. **Texto/ícone sobre foto, gradiente da marca ou tom vivo = `onMedia`** (branco nos dois temas).
   Véu/sombra sobre foto: `withAlpha(colors.scrim, x)`.
3. **Superfície escura que continua escura nos dois temas = `chrome`** (barra de abas, toast,
   cartão `.dcard.dark`, busca do mapa, hero escuro). Texto `onChrome` / `onChromeMuted` /
   `onChromeSubtle`. No escuro ela é um degrau acima do fundo e ganha fio claro de 1px
   (`chromeBorder`, já incluído em `shadows.nav`/`cardDark`/`toast`/`float`).
4. **Botão/pílula/chip "escuro" de contraste = `inverse`** (+ `onInverse`): escuro no claro,
   **claro** no escuro. É o `Button variant="dark"`, `Pill variant="dark"`, `Chip on`, contador
   do `Segmented`.
5. **Texto verde = `brandText`**, não `brand700` (no escuro o verde escuro some). `brand700`
   fica para preenchimento e gradiente.
6. **QR Code / código para leitor = `paper` + `onPaper`** (branco e preto nos dois temas).
7. Sombras sempre por `t.shadows.*`: no escuro elas são mais fortes e os elementos elevados
   ganham um fio claro interno (inset 1px) no lugar da sombra que não aparece.
8. Os tons de cartão (`green`, `clay`, `deep`) continuam vivos no escuro; `ink` vira `chrome`
   com fio; `sand` vira areia escura **com texto claro** — use sempre `toneOf(tone).fg/fgMuted`,
   nunca `colors.ink` sobre um tom. `statusBar` de tela com tom: `toneOf(tone)`/`dark`
   decidem (sand claro só no tema claro).

## Paletas

| Token | Claro | Escuro | Papel |
|---|---|---|---|
| `bg` | `#ffffff` | `#0e110e` | fundo da página |
| `surfaceSunken` | `#f6f3f0` | `#141814` | linha pressionada, campo só-leitura |
| `surface` | `#f3f1ee` | `#191d19` | cartão, campo, chip, botão soft |
| `surfaceRaised` | `#ffffff` | `#20251f` | painel, polegar do segmented, botão/pílula white |
| `surfaceStrong` | `#eee9e5` | `#252a25` | bloco/trilho sobre `surface` |
| `text` | `#141714` | `#f1f3f0` | texto principal |
| `textSecondary` | `#262a26` | `#d3d8d2` | texto de leitura (descrições) |
| `textMuted` | `#686d67` | `#959c93` | texto secundário |
| `textSubtle` | `#b0aaa3` | `#646b63` | placeholder, desabilitado, "fechado" |
| `border` | `#e7e3de` | `#272c27` | divisor, borda de campo |
| `borderStrong` | `#d6d2cd` | `#3a413a` | borda forte, ponto inativo |
| `dashed` | `rgba(20,23,20,.14)` | `rgba(255,255,255,.14)` | tracejado |
| `dashedOnChrome` | `rgba(255,255,255,.18)` | igual | tracejado sobre chrome/tom escuro |
| `brand` · `brand300` · `brand600` · `brand700` · `brand900` | marca | iguais | preenchimentos/gradientes |
| `brand50` | `#eef8ef` | `#142116` | tint leve |
| `brand100` | `#d8efdc` | `#1d3523` | tint (pílula brand, borda de callout) |
| `brandText` | `#2f7d3d` | `#7fd48d` | texto/ícone verde |
| `onBrand` | `#141714` | igual | texto sobre `brand` |
| `inverse` / `onInverse` | `#141714` / `#fff` | `#eef1ed` / `#141714` | botão/pílula/chip escuro |
| `chrome` | `#141714` | `#1c211c` | superfície escura fixa |
| `chromeBorder` | transparente | `rgba(255,255,255,.08)` | fio do chrome |
| `onChrome` | `#fff` | igual | texto sobre chrome |
| `onChromeMuted` | `rgba(255,255,255,.55)` | `rgba(255,255,255,.6)` | secundário sobre chrome |
| `onChromeSubtle` | `rgba(255,255,255,.45)` | igual | apagado sobre chrome |
| `chromeActive` / `onChromeActive` | `#fff` / `#141714` | `#eef1ed` / `#141714` | aba ativa |
| `onMedia` | `#fff` | igual | sobre foto/cor viva |
| `onMediaLine` | `rgba(255,255,255,.25)` | igual | trilho/contorno sobre mídia |
| `glass` | `rgba(255,255,255,.22)` | igual | vidro sobre foto |
| `scrim` | `#000` | igual | câmera, véus e sombras |
| `paper` / `onPaper` | `#fff` / `#000` | iguais | QR Code |
| `danger` | `#e0734a` | `#ec8560` | clay: favorito, alerta |
| `dangerSoft` | `#fde4da` | `#3a2219` | fundo de alerta |
| `dangerText` | `#b4502b` | `#f19a78` | texto de alerta |
| `overlay` | `rgba(12,14,12,.45)` | `rgba(0,0,0,.6)` | véu do painel |
| `skeleton` | `#f3f1ee` | `#1c211c` | carregando |
| `switchOff` | `#d6d2cd` | `#3a413a` | interruptor desligado |
| `switchOffOnChrome` | `#454a45` | igual | idem sobre chrome |
| `switchKnob` | `#fff` | igual | bolinha do interruptor |
| `locked` / `onLocked` | `#e3dfda` / `#b0aaa3` | `#262b26` / `#5f665e` | selo não conquistado |

Contraste medido (WCAG, testado em `design/theme/theme.test.ts`):

| Par | Claro | Escuro |
|---|---|---|
| `text` / `bg` | 18.1 | 17.0 |
| `textMuted` / `bg` | 3.9 ⚠ | 6.8 |
| `textMuted` / `surface` | 3.5 ⚠ | 6.1 |
| `textMuted` / `surfaceRaised` | 3.9 ⚠ | 5.5 |
| `onInverse` / `inverse` | 18.1 | 15.9 |
| `onChrome` / `chrome` | 18.1 | 16.4 |
| `onChromeMuted` / `chrome` | 6.1 | 6.7 |
| `onBrand` / `brand` | 7.9 | 7.9 |
| `brandText` / `bg` | 5.1 | 10.6 |
| `dangerText` / `bg` | 5.1 | 8.7 |

O `muted` do protótipo (`#7d827c`, 3.9:1) não passava AA para texto normal; foi escurecido
para `#686d67` (≥ 4.5:1 sobre `bg` e `surface`), quase imperceptível. O teste de contraste garante AA.

## Tabela de migração

Para código antigo que usava `colors.X` (paleta estática, já removida), use o token do tema. Onde a coluna "Caso" aparece,
olhe **o que está atrás** da cor.

| Antigo | Caso | Novo |
|---|---|---|
| `colors.white` | fundo de tela / `ScreenContainer background` | `bg` (ou omita: é o padrão) |
| `colors.white` | fundo de cartão/painel/botão/pílula elevado (com sombra), polegar | `surfaceRaised` |
| `colors.white` | aro em volta de foto/botão (recorte do fundo) | `bg` |
| `colors.white` | texto/ícone sobre botão/pílula/chip escuro (`ink` de fundo) | `onInverse` |
| `colors.white` | texto/ícone sobre barra/toast/cartão escuro fixo | `onChrome` |
| `colors.white` | texto/ícone sobre foto, gradiente da marca, tom vivo, selo | `onMedia` |
| `colors.white` | fundo do QR Code | `paper` |
| `colors.white` | bolinha do interruptor | `switchKnob` |
| `colors.ink` | texto, ícone | `text` (ou nada: é o padrão de `Text`/`Icon`) |
| `colors.ink` | fundo de botão/pílula/chip ligado/contador/ícone de sheet "escuro" | `inverse` (+ `onInverse`) |
| `colors.ink` | fundo de barra, toast, ticket/hero/cartão escuro, busca do mapa | `chrome` (+ `onChrome`) |
| `colors.ink` | texto/ícone sobre `brand` | `onBrand` |
| `colors.ink` | texto sobre tom (`sand`) | `toneOf(tone).fg` |
| `colors.ink2` | texto | `textSecondary` |
| `colors.card` | fundo | `surface` |
| `colors.sand` | bloco/skeleton/trilho sobre `surface` | `surfaceStrong` |
| `colors.sand2` | pressionado, só-leitura | `surfaceSunken` |
| `colors.muted` | texto/ícone | `textMuted` |
| `colors.line` | divisor, borda, alça | `border` |
| `colors.dotOff` | ponto inativo | `borderStrong` |
| `colors.closed` | ponto "fechado" | `textSubtle` |
| `colors.lockedInk` | placeholder de campo | `textSubtle` |
| `colors.locked` / `lockedInk` | selo bloqueado | `locked` / `onLocked` |
| `colors.brand`, `brand300`, `brand600`, `brand900` | — | mesmos nomes |
| `colors.brand700` | texto/ícone | `brandText` |
| `colors.brand700` | preenchimento, gradiente, glow | `brand700` |
| `colors.brand50` / `brand100` | fundo | mesmos nomes (escurecem no tema escuro) |
| `colors.clay` | ícone/ponto/preenchimento | `danger` |
| `colors.claySoft` | fundo | `dangerSoft` |
| `colors.clayInk` | texto/ícone | `dangerText` |
| `colors.black` | fundo de câmera; base de `withAlpha` em sombra/véu | `scrim` |
| `colors.black` | módulos/texto do QR e do código | `onPaper` |
| `colors.backdrop` | véu | `overlay` |
| `colors.glass` | vidro sobre foto | `glass` |
| `colors.switchOff` / `switchOffDark` | trilho | `switchOff` / `switchOffOnChrome` |
| `colors.dashed` / `dashedLight` | tracejado | `dashed` / `dashedOnChrome` |
| `colors.lineLight` | contorno/trilho sobre mídia | `onMediaLine` |
| `colors.onDarkMuted` | sobre chrome | `onChromeMuted` |
| `colors.onDarkMuted` | sobre foto | `withAlpha(colors.onMedia, 0.55)` |
| `colors.onDarkFaint` | sobre chrome | `onChromeSubtle` |
| `colors.navIdle` | aba inativa | `onChromeMuted` |
| `shadows.X` | qualquer | `t.shadows.X` (mesmos nomes) |
| `tones` / `toneOf` | qualquer | `useTheme().tones` / `useTheme().toneOf` |
| `gradients.X` | qualquer | `useTheme().gradients.X` (iguais nos dois temas) |
| `textTones.X` | qualquer | `<Text tone=…>` ou `useColors()` |
| `<Text tone="muted">` etc. | — | funciona; prefira `tone="textMuted"`, `"brandText"`, `"onMedia"` |
| `Surface/Card tone` | `card` / `white` / `ink` / `sand` | `surface` / `surfaceRaised` / `chrome` / `surfaceStrong` |
| `SheetIcon background={colors.X}` | — | `background="surface"` / `"inverse"` / `"brand"` (nome) |
| `ScreenContainer statusBar="dark"` | tela comum | remova (padrão `auto`) |

Variantes dos componentes do design (já migrados, nada a fazer na feature):

| Componente | Variante | Tema |
|---|---|---|
| `Button` | `dark` | `inverse` / `onInverse` (claro no escuro) |
| | `brand` | `brand` / `onBrand` |
| | `white` | `surfaceRaised` / `text` |
| | `soft` | `surface` / `text` |
| | `line` | borda `border` / `text` |
| | `lineLight` | borda `onMediaLine` / `onMedia` (sobre mídia, igual) |
| `IconButton` | `card` · `dark` · `white` · `glass` | `surface` · `inverse` · `surfaceRaised`+sombra · vidro |
| `Pill` | `default` · `brand` · `dark` · `clay` · `glass` · `white` | `surface` · `brand100`/`brandText` · `inverse` · `dangerSoft`/`dangerText` · vidro · `surfaceRaised` |
| `Chip` | `on` | `inverse` / `onInverse` |
| `SearchField` | `dark` | `chrome` (escuro nos dois temas) |
| `Switch` | `dark` | `switchOffOnChrome` |
| `DashedDivider` | `light` | `dashedOnChrome` |
| `ProgressBar` | padrão | `onMediaLine` / `onMedia` (sobre tom) |
| `CtaBar` | — | degradê de `bg` |
| `Toast` · `TabBar` | — | `chrome` (+ fio no escuro) |
| `Sheet` | — | `surfaceRaised`, véu `overlay` |

## Exemplo: antes e depois

Antes (estático, só claro):

```tsx
import { StyleSheet, View } from "react-native";
import { colors, Icon, shadows, Text } from "@/design";

export function InfoTile({ icon, label, dark }: Props) {
  return (
    <View style={[styles.tile, dark && styles.dark]}>
      <Icon name={icon} color={dark ? colors.brand : colors.brand700} />
      <Text color={dark ? colors.white : colors.ink}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 },
  dark: { backgroundColor: colors.ink, ...shadows.cardDark },
});
```

Depois (tema):

```tsx
import { View } from "react-native";
import { createStyles, Icon, Text, useColors } from "@/design";

export function InfoTile({ icon, label, dark }: Props) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.tile, dark && styles.dark]}>
      <Icon name={icon} color={dark ? colors.brand : colors.brandText} />
      <Text tone={dark ? "onChrome" : "text"}>{label}</Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  tile: { backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1 },
  // cartão escuro fixo: chrome (no tema escuro ganha o fio claro da sombra cardDark)
  dark: { backgroundColor: t.colors.chrome, ...t.shadows.cardDark },
}));
```

## Paleta estática

Não existe mais paleta estática: `colors`, `tones`, `toneOf` e `shadows` foram removidos de
`@/design` depois que todas as features migraram. Toda cor sai do tema (`createStyles`,
`useColors`, `useTheme`). `gradients` continua exportado (é igual nos dois temas), mas prefira
`useTheme().gradients`. Exceção consciente: a imagem do cupom salva na galeria usa a
paleta clara (`lightPalette`) para sair sempre legível no caixa.

Para conferir uma tela: troque o tema do aparelho, ou force por código em dev com
`setThemePreference("dark")`.
