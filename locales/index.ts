import { en, type MessageSchema } from "./en"
import { zhCN } from "./zh-CN"

export const dictionaries: Record<string, MessageSchema> = {
  en,
  "zh-CN": zhCN,
}

export type { MessageSchema }

