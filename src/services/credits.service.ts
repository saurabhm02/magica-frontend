import { CreditBalanceResponse, ListLedgerQuery, ListLedgerResponse } from "@/contracts/api";
import { request } from "./api-client";

export function getCreditBalance(token: string) {
  return request("/me/credits", { schema: CreditBalanceResponse, token });
}

export function getCreditLedger(token: string, query?: Partial<ListLedgerQuery>) {
  return request("/me/credits/ledger", { schema: ListLedgerResponse, query, token });
}
