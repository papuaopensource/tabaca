import type { SourceId } from "@/storage/schema"
import { bbcAdapter } from "./bbc"
import { theConversationAdapter } from "./theconversation"
import { jubiAdapter } from "./jubi"
import { antaraPapuaAdapter } from "./antara-papua"
import type { SourceAdapter } from "./types"

export const ALL_ADAPTERS: SourceAdapter[] = [
  bbcAdapter,
  theConversationAdapter,
  jubiAdapter,
  antaraPapuaAdapter
]

export const ADAPTER_MAP: Record<SourceId, SourceAdapter> = {
  bbc: bbcAdapter,
  theconversation: theConversationAdapter,
  jubi: jubiAdapter,
  "antara-papua": antaraPapuaAdapter
}

export { bbcAdapter, theConversationAdapter, jubiAdapter, antaraPapuaAdapter }
export type { SourceAdapter, RawItem } from "./types"
