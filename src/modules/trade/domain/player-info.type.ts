/**
 * PlayerInfo represents minimal player data for trade relationships.
 * Used for sender, receiver, and handler references in trades.
 */
interface PlayerInfo {
  id: number;
  code?: string;
  name: string;
}

export type { PlayerInfo };
