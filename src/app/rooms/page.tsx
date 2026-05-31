import type { Metadata } from "next";
import { GlobalChat } from "@/components/chat/global-chat";
import { RoomsLobbyShell } from "@/components/chat/rooms-lobby-shell";
import { RequireAuth } from "@/components/shared/require-auth";

export const metadata: Metadata = {
  title: "Minhas salas",
};

export default function RoomsPage() {
  return (
    <RequireAuth>
      <RoomsLobbyShell>
        <GlobalChat lobbyOnly />
      </RoomsLobbyShell>
    </RequireAuth>
  );
}
