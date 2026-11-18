import { describe, expect, it } from "vitest";
import { l1TransferTags } from "@gleam/core/src/ao/l1-transfer.ts";
import { assertTransferMatches } from "./prepared-check.ts";
import type { ArweaveTransactionJson } from "@gleam/core/src/arweave/transaction.ts";
import { bytesToBase64Url } from "@gleam/core/src/vault/base64.ts";

const PROCESS_ID = "EuEkh8ZYkoPKXimgjre7W268XXX_qRn5vofc66oRTOw";
const RECIPIENT = "R".repeat(43);
const OWNER = "O".repeat(43);

const encoder = new TextEncoder();
const b64 = (text: string) => bytesToBase64Url(encoder.encode(text));

function payload(quantity: string, reward: string): { kind: "transaction"; transaction: ArweaveTransactionJson } {
  return {
    kind: "transaction",
    transaction: {
      format: 2,
      id: "",
      last_tx: "",
      owner: OWNER,
      tags: l1TransferTags(RECIPIENT, "7").map((tag) => ({ name: b64(tag.name), value: b64(tag.value) })),
      target: PROCESS_ID,
      quantity,
      data: "",
      data_size: "0",
      data_root: "",
      reward,
      signature: "",
    },
  };
}

const approved = { recipient: RECIPIENT, amount: "7", token: PROCESS_ID, fee: "1000" };

describe("assertTransferMatches: L1 fee split", () => {
  it("accepts value 0 with the full fee as reward", () => {
    expect(() => assertTransferMatches(approved, payload("0", "1000"))).not.toThrow();
  });

  it("accepts the activation winston taken out of the fee", () => {
    expect(() => assertTransferMatches(approved, payload("1", "999"))).not.toThrow();
  });

  it("refuses any other AR value even when reward is adjusted to match the fee", () => {
    expect(() => assertTransferMatches(approved, payload("2", "998"))).toThrow(/amount/);
    expect(() => assertTransferMatches(approved, payload("1000", "0"))).toThrow(/amount/);
  });

  it("refuses a fee smaller than the activation winston", () => {
    expect(() => assertTransferMatches({ ...approved, fee: "0" }, payload("1", "0"))).toThrow(/fee/);
  });
});
