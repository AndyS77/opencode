import { expect, test } from "bun:test"
import { jitCompatCheck } from "../src/internal/drizzle-utils"

test("jitCompatCheck returns true for true", () => {
  expect(jitCompatCheck(true)).toBe(true)
})

test("jitCompatCheck returns false for false", () => {
  expect(jitCompatCheck(false)).toBe(false)
})

test("jitCompatCheck returns false for undefined", () => {
  expect(jitCompatCheck(undefined)).toBe(false)
})
