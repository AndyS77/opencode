import { createOpencodeClient } from "@opencode-ai/sdk/v2"
import { SessionID } from "@/session/schema"
import { Option, Schema } from "effect"

const decodeSessionID = Schema.decodeUnknownOption(SessionID)

export async function validateSession(input: {
  url: string
  sessionID?: string
  directory?: string
  fetch?: typeof fetch
  headers?: RequestInit["headers"]
}) {
  if (!input.sessionID) return

  const sessionID = decodeSessionID(input.sessionID)
  if (Option.isNone(sessionID)) throw new Error("Invalid session ID")

  await createOpencodeClient({
    baseUrl: input.url,
    directory: input.directory,
    fetch: input.fetch,
    headers: input.headers,
  }).session.get({ sessionID: sessionID.value }, { throwOnError: true })
}
