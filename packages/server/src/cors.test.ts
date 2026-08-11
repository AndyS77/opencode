import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { CorsConfig, isAllowedCorsOrigin, isAllowedRequestOrigin } from "./cors"

describe("isAllowedCorsOrigin", () => {
  test("returns true for undefined origin", () => {
    expect(isAllowedCorsOrigin(undefined)).toBe(true)
  })

  test("returns true for localhost", () => {
    expect(isAllowedCorsOrigin("http://localhost:3000")).toBe(true)
  })

  test("returns true for 127.0.0.1", () => {
    expect(isAllowedCorsOrigin("http://127.0.0.1:8080")).toBe(true)
  })

  test("returns true for oc://renderer", () => {
    expect(isAllowedCorsOrigin("oc://renderer")).toBe(true)
  })

  test("returns true for tauri://localhost", () => {
    expect(isAllowedCorsOrigin("tauri://localhost")).toBe(true)
  })

  test("returns true for http://tauri.localhost", () => {
    expect(isAllowedCorsOrigin("http://tauri.localhost")).toBe(true)
  })

  test("returns true for https://tauri.localhost", () => {
    expect(isAllowedCorsOrigin("https://tauri.localhost")).toBe(true)
  })

  test("returns true for opencode.ai subdomains", () => {
    expect(isAllowedCorsOrigin("https://opencode.ai")).toBe(true)
    expect(isAllowedCorsOrigin("https://app.opencode.ai")).toBe(true)
    expect(isAllowedCorsOrigin("https://sub.domain.opencode.ai")).toBe(true)
  })

  test("returns false for arbitrary origin without cors options", () => {
    expect(isAllowedCorsOrigin("https://evil.example.com")).toBe(false)
  })

  test("returns true when origin is in cors options", () => {
    expect(isAllowedCorsOrigin("https://evil.example.com", { cors: ["https://evil.example.com"] })).toBe(true)
  })

  test("returns false when origin is not in cors options", () => {
    expect(isAllowedCorsOrigin("https://evil.example.com", { cors: ["https://safe.example.com"] })).toBe(false)
  })

  test("does not match opencode.ai lookalike domains", () => {
    expect(isAllowedCorsOrigin("https://opencode.evil.com")).toBe(false)
  })

  test("does not match http (non-localhost) opencode.ai", () => {
    expect(isAllowedCorsOrigin("http://opencode.ai")).toBe(false)
  })
})

describe("isAllowedRequestOrigin", () => {
  test("returns true for undefined origin", () => {
    expect(isAllowedRequestOrigin(undefined, undefined)).toBe(true)
  })

  test("returns true when origin host matches request host", () => {
    expect(isAllowedRequestOrigin("http://example.com:8080", "example.com:8080")).toBe(true)
  })

  test("returns false when origin host differs from request host and origin is not allowed", () => {
    expect(isAllowedRequestOrigin("https://evil.example.com", "example.com:3000")).toBe(false)
  })

  test("returns true for localhost even when host differs", () => {
    expect(isAllowedRequestOrigin("http://localhost:3000", "example.com:8080")).toBe(true)
  })

  test("returns true when origin is in cors options even if host differs", () => {
    expect(
      isAllowedRequestOrigin("https://custom.example.com", "other.host:3000", {
        cors: ["https://custom.example.com"],
      }),
    ).toBe(true)
  })

  test("returns false for invalid URL origin", () => {
    expect(isAllowedRequestOrigin("not-a-url", "example.com")).toBe(false)
  })
})

describe("CorsConfig", () => {
  test("defaults to undefined", () => {
    const value = Effect.runSync(CorsConfig)
    expect(value).toBeUndefined()
  })
})
