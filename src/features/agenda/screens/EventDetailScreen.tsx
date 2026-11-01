import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import type { EventDetail } from "@/contracts/app/agenda";
import { isApiError } from "@/core/api/errors";
import {
  BottomSpacer,
  Button,
  CtaBar,
  createStyles,
  EmptyState,
  IconButton,
  NavHeader,
  ScreenContainer,
  Text,
  useCtaBarHeight,
} from "@/design";
import { goBackOr, openPath } from "@/navigation/navigate";
import { useRefreshControl } from "@/shared/hooks/useRefreshControl";
import { QueryFallback } from "@/shared/query/QueryFallback";
import { queryView } from "@/shared/query/query-view";
import { findEventPreview, useEvent, useToggleInterest } from "../api/agenda";
import { EventDetailSkeleton } from "../components/EventDetailSkeleton";
import { EventBody, EventHero, EventTitle } from "../components/EventHero";
import { Rule, Rules } from "../components/EventRules";
import { SealCallout } from "../components/SealCallout";
import { useEventActions } from "../hooks/useEventActions";
import { eventFacts, isEventEnded } from "../lib/event-facts";

const back = () => goBackOr("/");

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const query = useEvent(id);
  const refreshControl = useRefreshControl(query.refetch);
  const view = queryView(query);

  if (query.data) {
    return <EventDetailView event={query.data} refreshControl={refreshControl} />;
  }
  if (view === "loading") {
    return (
      <ScreenContainer top="none" statusBar="light">
        <EventDetailSkeleton preview={findEventPreview(qc, id)} onBack={back} />
      </ScreenContainer>
    );
  }

  const notFound = isApiError(query.error) && query.error.code === "NOT_FOUND";
  return (
    <ScreenContainer top="none">
      <NavHeader onBack={back} />
      {notFound ? (
        <NotFound />
      ) : (
        <QueryFallback
          view={view === "ready" ? "error" : view}
          skeleton={null}
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}
    </ScreenContainer>
  );
}

function NotFound() {
  const router = useRouter();
  return (
    <EmptyState
      icon="calendar-days"
      title="Evento não encontrado"
      text="Ele pode ter saído da agenda. Veja o que mais está acontecendo na ARP."
      action={{ label: "Ver agenda", onPress: () => router.replace("/agenda") }}
    />
  );
}

type ViewProps = {
  event: EventDetail;
  refreshControl: ReturnType<typeof useRefreshControl>;
};

function EventDetailView({ event, refreshControl }: ViewProps) {
  const styles = useStyles();
  const ctaHeight = useCtaBarHeight();
  const interest = useToggleInterest();
  const actions = useEventActions(event);
  const ended = isEventEnded(event);
  const facts = eventFacts(event);

  return (
    <View style={styles.fill}>
      <ScreenContainer top="none" statusBar="light" scroll scrollProps={{ refreshControl }}>
        <EventHero event={event} ended={ended} onBack={back} onShare={actions.share} />
        <EventBody>
          <EventTitle>{event.title}</EventTitle>
          {event.description ? (
            <Text variant="body" tone="textSecondary" style={styles.desc}>
              {event.description}
            </Text>
          ) : null}
          <Rules>
            {facts.map((f, i) => {
              const href = f.href;
              return (
                <Rule
                  key={f.key}
                  icon={f.icon}
                  label={f.label}
                  value={f.value}
                  onPress={href ? () => openPath(href) : undefined}
                  accessibilityHint={f.hint}
                  last={i === facts.length - 1}
                />
              );
            })}
          </Rules>
          {event.awardsSeal && !ended ? (
            <SealCallout onPress={() => openPath("/desafios")} />
          ) : null}
        </EventBody>
        {ended ? <BottomSpacer kind="safe" /> : <View style={{ height: ctaHeight + 12 }} />}
      </ScreenContainer>

      {ended ? null : (
        <CtaBar>
          <Button
            label={event.isInterested ? "Você tem interesse" : "Tenho interesse"}
            variant={event.isInterested ? "brand" : "dark"}
            iconLeft={event.isInterested ? "check" : "heart"}
            onPress={() => interest.toggle(event.id)}
            accessibilityHint={
              event.isInterested ? "Remove dos seus eventos" : "Salva e lembra você no dia"
            }
            style={styles.flex}
          />
          <IconButton
            icon="calendar-plus"
            size={58}
            accessibilityLabel="Adicionar ao calendário do aparelho"
            onPress={actions.addToCalendar}
            disabled={actions.addingToCalendar}
          />
        </CtaBar>
      )}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  desc: { marginTop: 16, lineHeight: 23 },
}));
