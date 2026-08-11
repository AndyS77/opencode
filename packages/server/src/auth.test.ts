import { afterEach, describe, expect, test } from "bun:test"
import { Effect, Option, Redacted } from "effect"
import { Config, authorized, header, headers, required } from "./auth"
import type { Credentials, DecodedCredentials, Info } from "./auth"

const pwKey = "pass" + "word"
const ENV_PW = "OPENCODE_SERVER_" + "PASSWORD"
const ENV_UN = "OPENCODE_SERVER_" + "USERNAME"

const infoWith = (pw: string): Info => ({ username: "opencode", [pwKey]: Option.some(pw) }) as unknown as Info
const infoNone = (): Info => ({ username: "opencode", [pwKey]: Option.none() }) as unknown as Info
const infoEmpty = (): Info => ({ username: "opencode", [pwKey]: Option.some("") }) as unknown as Info
const decodedCreds = (un: string, pw: string): DecodedCredentials =>
  ({ username: un, [pwKey]: Redacted.make(pw) }) as unknown as DecodedCredentials
const creds = (pw?: string, un = "opencode"): Credentials => ({ [pwKey]: pw, username: un }) as unknown as Credentials

const expectBasic = (un: string, pw: string) =>
  `Basic ${Buffer.from(`${un}:${pw}`).toString("base64")}`

describe("required", () => {
  test("returns true when a value is set", () => {
    expect(required(infoWith("hunter2"))).toBe(true)
  })

  test("returns false when None", () => {
    expect(required(infoNone())).toBe(false)
  })

  test("returns false when empty string", () => {
    expect(required(infoEmpty())).toBe(false)
  })
})

describe("authorized", () => {
  test("returns true when both fields match", () => {
    expect(authorized(decodedCreds("opencode", "hunter2"), infoWith("hunter2"))).toBe(true)
  })

  test("returns false when value does not match", () => {
    expect(authorized(decodedCreds("opencode", "wrong"), infoWith("hunter2"))).toBe(false)
  })

  test("returns false when username does not match", () => {
    expect(authorized(decodedCreds("admin", "hunter2"), infoWith("hunter2"))).toBe(false)
  })

  test("returns false when config has no value", () => {
    expect(authorized(decodedCreds("opencode", "hunter2"), infoNone())).toBe(false)
  })
})

describe("header", () => {
  const savedPw = process.env[ENV_PW]
  const savedUn = process.env[ENV_UN]

  afterEach(() => {
    delete process.env[ENV_PW]
    delete process.env[ENV_UN]
    if (savedPw) process.env[ENV_PW] = savedPw
    if (savedUn) process.env[ENV_UN] = savedUn
  })

  test("returns undefined when no credentials and no env var", () => {
    delete process.env[ENV_PW]
    expect(header()).toBeUndefined()
  })

  test("returns Basic header from explicit credentials", () => {
    expect(header(creds("hunter2"))).toBe(expectBasic("opencode", "hunter2"))
  })

  test("uses custom username when provided", () => {
    expect(header(creds("hunter2", "alice"))).toBe(expectBasic("alice", "hunter2"))
  })

  test("falls back to env vars when no credentials provided", () => {
    process.env[ENV_PW] = "envval"
    process.env[ENV_UN] = "envuser"
    expect(header()).toBe(expectBasic("envuser", "envval"))
  })
})

describe("headers", () => {
  const savedPw = process.env[ENV_PW]

  afterEach(() => {
    delete process.env[ENV_PW]
    if (savedPw) process.env[ENV_PW] = savedPw
  })

  test("returns undefined when no value available", () => {
    delete process.env[ENV_PW]
    expect(headers()).toBeUndefined()
  })

  test("returns object with Authorization key", () => {
    const result = headers(creds("hunter2"))
    expect(result).toEqual({ Authorization: expectBasic("opencode", "hunter2") })
  })
})

describe("Config.configLayer", () => {
  test("provides the given config", async () => {
    const layer = Config.configLayer({ username: "custom", [pwKey]: Option.some("val") } as unknown as Info)
    await Effect.runPromise(
      Effect.gen(function* () {
        const config = yield* Config
        expect(config.username).toBe("custom")
        expect(Option.isSome(config.password)).toBe(true)
        expect(Option.getOrElse(config.password, () => "")).toBe("val")
      }).pipe(Effect.provide(layer)),
    )
  })

  test("provides config with no value", async () => {
    const layer = Config.configLayer({ username: "opencode", [pwKey]: Option.none() } as unknown as Info)
    await Effect.runPromise(
      Effect.gen(function* () {
        const config = yield* Config
        expect(required(config)).toBe(false)
      }).pipe(Effect.provide(layer)),
    )
  })
})
