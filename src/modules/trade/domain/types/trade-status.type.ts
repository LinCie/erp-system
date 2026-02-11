/**
 * Valid trade status values.
 * TX_DRAFT - Initial draft state
 * TX_REQUEST - Requested trade
 * TX_READY - Ready for processing
 * TX_SENT - Sent to receiver
 * TX_RECEIVED - Received by receiver
 * TX_COMPLETED - Trade completed
 * TX_CANCELED - Trade canceled
 * TX_RETURN - Trade returned
 * TX_CLOSED - Trade closed
 */
const TRADE_STATUS = [
  "TX_DRAFT",
  "TX_REQUEST",
  "TX_READY",
  "TX_SENT",
  "TX_RECEIVED",
  "TX_COMPLETED",
  "TX_CANCELED",
  "TX_RETURN",
  "TX_CLOSED",
] as const;

type TradeStatusType = (typeof TRADE_STATUS)[number];

export { TRADE_STATUS };
export type { TradeStatusType };
