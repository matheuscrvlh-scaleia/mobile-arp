/* Painel de mensagem: o formato mais repetido dos sheets do protótipo — ícone num quadrado,
   título, texto e botões empilhados. */
import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "../components/Button";
import type { IconName } from "../components/Icon";
import { SheetActions, type SheetColor, SheetIcon, SheetText, SheetTitle } from "./SheetParts";
import { type SheetApi, sheet } from "./store";

export type SheetMessageAction = {
  label: string;
  /** Padrão: o primeiro botão `dark`, os outros `soft`. */
  variant?: ButtonVariant;
  icon?: IconName;
  /** Roda depois de fechar o painel. Sem ação, o botão só fecha. */
  onPress?: () => void;
  accessibilityHint?: string;
};

export type SheetMessageOptions = {
  icon: IconName;
  /**
   * Fundo do quadrado do ícone (padrão `"brand"`). Use o NOME da cor do tema (`"surface"`,
   * `"inverse"`…): este painel costuma ser aberto fora do React e o nome é resolvido ao desenhar.
   */
  iconBackground?: SheetColor;
  /** Padrão: a cor "on" do fundo (ver SheetIcon). */
  iconColor?: SheetColor;
  title: ReactNode;
  text: ReactNode;
  actions: readonly SheetMessageAction[];
  /** Tocar no fundo, arrastar e o voltar do Android fecham. Padrão true. */
  dismissible?: boolean;
  /** Chamado quando o painel sai (por botão, gesto ou outro painel no lugar). */
  onClose?: () => void;
};

type SheetMessageProps = Omit<SheetMessageOptions, "dismissible" | "onClose"> & { api: SheetApi };

export function SheetMessage({
  icon,
  iconBackground,
  iconColor,
  title,
  text,
  actions,
  api,
}: SheetMessageProps) {
  return (
    <>
      <SheetIcon name={icon} background={iconBackground} color={iconColor} />
      <SheetTitle>{title}</SheetTitle>
      <SheetText>{text}</SheetText>
      <SheetActions>
        {actions.map((a, i) => (
          <Button
            key={a.label}
            label={a.label}
            variant={a.variant ?? (i === 0 ? "dark" : "soft")}
            iconLeft={a.icon}
            accessibilityHint={a.accessibilityHint}
            onPress={a.onPress ? api.closeThen(a.onPress) : api.close}
          />
        ))}
      </SheetActions>
    </>
  );
}

/** `sheet.message({...})`: abre o painel de mensagem. Os botões fecham o painel antes de agir. */
export function openMessageSheet({ dismissible, onClose, ...props }: SheetMessageOptions): number {
  return sheet.open((api) => <SheetMessage {...props} api={api} />, { dismissible, onClose });
}
