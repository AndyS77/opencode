import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { Service, layer } from "./pty-environment"

describe("pty-environment", () => {
  test("layer provides a service that returns empty environment", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* Service
        const env = yield* svc.get({ directory: "/tmp", cwd: "/tmp" })
        expect(env).toEqual({})
      }).pipe(Effect.provide(layer)),
    )
  })
})
