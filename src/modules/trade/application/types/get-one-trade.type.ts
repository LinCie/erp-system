/**
 * Props for getOne operation
 */
type GetOneTradeProps = {
  id: number;
  spaceId?: number;
  withDetails?: boolean;
  withPlayers?: boolean;
  withChildren?: boolean;
  withParent?: boolean;
};

export type { GetOneTradeProps };
