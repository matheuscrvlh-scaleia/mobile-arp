import { useState } from "react";
import { ScrollView, View } from "react-native";
import type { MerchantStore } from "@/contracts/app/merchant";
import {
  BottomSpacer,
  createStyles,
  EmptyState,
  layout,
  NavHeader,
  ScreenContainer,
  SearchField,
  Text,
} from "@/design";
import { ResultRow } from "@/features/stores";
import { plural } from "@/shared/lib/format";
import { filterStores, STORE_SEARCH_MIN } from "../lib/overview";
import { StoreMono } from "./StoreMono";

export type StorePickerProps = {
  stores: readonly MerchantStore[];
  selectedId: string | null;
  onSelect: (store: MerchantStore) => void;
  /** Voltar do seletor (sem loja escolhida: sai do painel). */
  onBack: () => void;
};

/** Usuário sem loja (administração): escolhe em qual caixa vai agir. Busca acima de 8 lojas. */
export function StorePicker({ stores, selectedId, onSelect, onBack }: StorePickerProps) {
  const styles = useStyles();
  const [q, setQ] = useState("");
  const searchable = stores.length >= STORE_SEARCH_MIN;
  const shown = searchable ? filterStores(stores, q) : stores;

  return (
    <ScreenContainer top="none">
      <NavHeader title="Escolha a loja" onBack={onBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <Text variant="muted" style={styles.lead}>
          Seu usuário enxerga {plural(stores.length, "loja", "lojas")} da ARP. Escolha em qual caixa
          você vai validar cupons e ver os números.
        </Text>
        {searchable ? (
          <SearchField
            value={q}
            onChangeText={setQ}
            placeholder="Buscar loja"
            style={styles.search}
          />
        ) : null}
        <View style={styles.list}>
          {shown.map((store) => (
            <ResultRow
              key={store.id}
              leading={<StoreMono store={store} size={44} />}
              title={store.name}
              trailingIcon={store.id === selectedId ? "check" : "chevron-right"}
              selected={store.id === selectedId}
              onPress={() => onSelect(store)}
              accessibilityLabel={store.id === selectedId ? `${store.name}, atual` : store.name}
            />
          ))}
        </View>
        {shown.length === 0 ? (
          <EmptyState
            icon="search-x"
            title="Nenhuma loja encontrada"
            text="Confira o nome ou busque por outra parte dele."
            compact
          />
        ) : null}
        <BottomSpacer kind="safe" />
      </ScrollView>
    </ScreenContainer>
  );
}

const useStyles = createStyles(() => ({
  lead: { paddingHorizontal: layout.gutter, marginTop: 14, marginBottom: 16, lineHeight: 22 },
  search: { marginHorizontal: layout.gutter, marginBottom: 8 },
  list: { marginTop: 4 },
}));
