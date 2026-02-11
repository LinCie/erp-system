type TradeTimestamp = {
  createdAt: Date;
  packagedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  completedAt: Date | null;
};

export type { TradeTimestamp };
