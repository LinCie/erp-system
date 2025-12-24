import type { TransactionEntity } from "../../domain/transaction.entity.ts";
import type { TransactionDetailEntity } from "../../domain/transaction-detail.entity.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";

const validTransaction: TransactionEntity = {
  id: 1,
  number: "TRD_1",
  class: "trade",
  space_type: "Space",
  space_id: 1,
  model_type: "Order",
  model_id: 100,
  type_type: "TRD",
  type_id: 1,
  sender_type: "Player",
  sender_id: 10,
  receiver_type: "Player",
  receiver_id: 20,
  handler_type: "Player",
  handler_id: 15,
  input_type: "Inventory",
  input_id: 50,
  output_type: "Inventory",
  output_id: 51,
  parent_type: "Transaction",
  parent_id: 0,
  relation_type: "Group",
  relation_id: 5,
  input_address: { street: "123 Input St", city: "InputCity", zip: "12345" },
  output_address: {
    street: "456 Output Ave",
    city: "OutputCity",
    zip: "67890",
  },
  request_time: new Date("2024-01-01T08:00:00Z"),
  sent_time: new Date("2024-01-01T09:00:00Z"),
  received_time: new Date("2024-01-01T10:00:00Z"),
  total: "1000.00",
  total_details: "950.00",
  fee: "50.00",
  fee_rules: "standard",
  description: "Test transaction description",
  sender_notes: "Sender notes here",
  receiver_notes: "Receiver notes here",
  handler_notes: "Handler notes here",
  handler_number: "HDL-001",
  notes: "General transaction notes",
  files: ["file1.pdf", "file2.jpg"],
  tags: ["urgent", "verified"],
  links: ["https://example.com/ref1"],
  status: "TX_DRAFT",
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

const minimalTransaction: TransactionEntity = {
  id: 2,
  total: "500.00",
  fee: "25.00",
  status: "TX_DRAFT",
};

const tradeTransaction: TransactionEntity = {
  id: 3,
  number: "TRD_3",
  type_type: "TRD",
  type_id: 3,
  sender_type: "Player",
  sender_id: 30,
  receiver_type: "Player",
  receiver_id: 40,
  total: "2000.00",
  total_details: "1900.00",
  fee: "100.00",
  status: "TX_SENT",
  sent_time: new Date("2024-01-02T10:00:00Z"),
  created_at: new Date("2024-01-02T00:00:00Z"),
  updated_at: new Date("2024-01-02T00:00:00Z"),
};

const quoteTransaction: TransactionEntity = {
  id: 4,
  number: "QUO_4",
  type_type: "QUO",
  type_id: 4,
  sender_type: "Player",
  sender_id: 50,
  receiver_type: "Player",
  receiver_id: 60,
  total: "1500.00",
  fee: "0.00",
  description: "Quote for services",
  status: "TX_DRAFT",
  created_at: new Date("2024-01-03T00:00:00Z"),
  updated_at: new Date("2024-01-03T00:00:00Z"),
};

const sentTransaction: TransactionEntity = {
  id: 5,
  number: "TRD_5",
  type_type: "TRD",
  type_id: 5,
  total: "750.00",
  fee: "37.50",
  status: "TX_SENT",
  sent_time: new Date("2024-01-04T12:00:00Z"),
  created_at: new Date("2024-01-04T00:00:00Z"),
  updated_at: new Date("2024-01-04T00:00:00Z"),
};

const receivedTransaction: TransactionEntity = {
  id: 6,
  number: "TRD_6",
  type_type: "TRD",
  type_id: 6,
  total: "3000.00",
  fee: "150.00",
  status: "TX_RECEIVED",
  sent_time: new Date("2024-01-05T10:00:00Z"),
  received_time: new Date("2024-01-05T14:00:00Z"),
  created_at: new Date("2024-01-05T00:00:00Z"),
  updated_at: new Date("2024-01-05T00:00:00Z"),
};

const closedTransaction: TransactionEntity = {
  id: 7,
  number: "TRD_7",
  type_type: "TRD",
  type_id: 7,
  total: "1200.00",
  fee: "60.00",
  status: "TX_CLOSED",
  sent_time: new Date("2024-01-06T10:00:00Z"),
  received_time: new Date("2024-01-06T14:00:00Z"),
  created_at: new Date("2024-01-06T00:00:00Z"),
  updated_at: new Date("2024-01-06T00:00:00Z"),
};

const archivedTransaction: TransactionEntity = {
  id: 8,
  number: "TRD_8",
  type_type: "TRD",
  type_id: 8,
  total: "800.00",
  fee: "40.00",
  status: "archived",
  deleted_at: new Date("2024-01-15T00:00:00Z"),
  created_at: new Date("2024-01-07T00:00:00Z"),
  updated_at: new Date("2024-01-07T00:00:00Z"),
};

const transactionWithDetailsData: {
  transaction: TransactionEntity;
  details: TransactionDetailEntity[];
} = {
  transaction: {
    id: 9,
    number: "TRD_9",
    type_type: "TRD",
    type_id: 9,
    sender_type: "Player",
    sender_id: 70,
    receiver_type: "Player",
    receiver_id: 80,
    total: "2850.00",
    total_details: "2850.00",
    fee: "142.50",
    status: "TX_DRAFT",
    created_at: new Date("2024-01-08T00:00:00Z"),
    updated_at: new Date("2024-01-08T00:00:00Z"),
  },
  details: [
    {
      id: 1,
      transaction_id: 9,
      model_type: "SO",
      sku: "ITEM-001",
      name: "Product A",
      quantity: "10.00",
      price: "100.00",
      discount: "0.05",
      cost_per_unit: "80.00",
      debit: "10.00",
      credit: "0.00",
      status: "active",
    },
    {
      id: 2,
      transaction_id: 9,
      model_type: "SO",
      sku: "ITEM-002",
      name: "Product B",
      quantity: "20.00",
      price: "100.00",
      discount: "0.00",
      cost_per_unit: "85.00",
      debit: "20.00",
      credit: "0.00",
      status: "active",
    },
  ],
};

const transactionsList: TransactionEntity[] = [
  validTransaction,
  minimalTransaction,
  tradeTransaction,
  quoteTransaction,
  sentTransaction,
  receivedTransaction,
  closedTransaction,
  archivedTransaction,
];

const sampleMetadata: GetManyMetadataType = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 8,
  totalPages: 1,
};

const createTransactionData: Omit<TransactionEntity, "id"> = {
  type_type: "TRD",
  type_id: 10,
  sender_type: "Player",
  sender_id: 90,
  receiver_type: "Player",
  receiver_id: 100,
  total: "1000.00",
  fee: "50.00",
  description: "New transaction",
  status: "TX_DRAFT",
};

const updateTransactionData: Partial<TransactionEntity> = {
  description: "Updated transaction description",
  handler_notes: "Updated handler notes",
  status: "TX_SENT",
  sent_time: new Date("2024-01-10T10:00:00Z"),
};

export {
  archivedTransaction,
  closedTransaction,
  createTransactionData,
  minimalTransaction,
  quoteTransaction,
  receivedTransaction,
  sampleMetadata,
  sentTransaction,
  tradeTransaction,
  transactionsList,
  transactionWithDetailsData,
  updateTransactionData,
  validTransaction,
};
