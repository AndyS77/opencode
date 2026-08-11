# Deep Code and Test Review Report

**Date:** 2026-08-11
**Reviewer:** Automated Weekend Mode Review
**Scope:** Full monorepo — `packages/core`, `packages/opencode`, `packages/schema`, `packages/protocol`, `packages/server`, `packages/client`, plus auxiliary packages

---

## 1. Executive Summary

The opencode monorepo is a large, well-structured TypeScript codebase built on Bun and Effect v4. The architecture follows a clear dependency direction (Schema -> Core -> Protocol -> Server; Client depends only on Schema + Protocol). The codebase uses Effect v4 patterns extensively and correctly in most places.

**Key strengths:**
- Clean package boundaries with enforced dependency direction
- Consistent use of Effect v4 service patterns (`Context.Service`, `Layer.effect`, `Effect.fn`)
- Self-reexport module pattern (`export * as Foo from "./foo"`) applied consistently
- Good use of Schema for typed data contracts
- Auth files written with `0o600` permissions

**Key concerns:**
- 170 explicit `any` type usages in core packages
- 329 `consistent-return` violations (functions with mixed return/no-return paths)
- 255 unsafe type assertions (`as` casts without type narrowing)
- 11 packages with zero test files (including `server`)
- Extensive use of star imports (`import * as`) which violates AGENTS.md
- `new Function()` usage in debug CLI (code injection risk)

---

## 2. Architecture Compliance

### Dependency Direction: PASS

Verified that runtime dependencies follow the mandated direction:

| Check | Result |
|-------|--------|
| Client imports from Core | **PASS** — no imports found |
| Client imports from Server | **PASS** — no imports found |
| Schema imports from Server | **PASS** — no imports found |
| Protocol imports from Server | **PASS** — no imports found |
| Schema imports from Core | **PASS** — no imports found |
| Protocol imports from Core | **PASS** — no imports found |

The `sdk-next` package composes Client + Core + Server as documented.

### Module Shape: MOSTLY COMPLIANT

The self-reexport pattern (`export * as Foo from "./foo"`) is used consistently across `packages/core` and `packages/opencode`. This matches the AGENTS.md guidance. The linter's `import/no-self-import` rule flags these as violations, so it has been disabled in the config (false positives on intentional pattern).

---

## 3. Anti-Pattern Analysis

### 3.1 `any` Type Usage (AGENTS.md: "Avoid using the `any` type")

**Severity: Medium-High**

170 explicit `any` usages found in core packages. Key offenders:

| File | Count | Notes |
|------|-------|-------|
| `packages/opencode/src/provider/provider.ts` | ~20 | `sdk: any` in `getModel` functions, `Record<string, any>` for options |
| `packages/opencode/src/provider/transform.ts` | ~8 | `(part: any)` in filter callbacks, `any` return types |
| `packages/opencode/src/plugin/github-copilot/copilot.ts` | ~8 | `(msg: any)`, `(part: any)` in array filtering |
| `packages/opencode/src/util/rpc.ts` | 4 | `(input: any) => any` for RPC method signatures |
| `packages/core/src/npm.ts` | 2 | `pkg as any`, `lock as any` |
| `packages/core/src/database/sqlite.bun.ts` | 2 | `params as any` for SQLite statement binding |
| `packages/opencode/src/lsp/client.ts` | 2 | `process.stdout as any`, `process.stdin as any` |
| `packages/opencode/src/tool/tool.ts` | 1 | `[key: string]: any` index signature |

**Recommendation:** Replace `any` with `unknown` and narrow with type guards, or define proper interfaces for external SDK types.

### 3.2 Star Imports (AGENTS.md: "Never use star imports")

**Severity: Medium**

Star imports (`import * as Foo from "..."`) are used extensively across the codebase, particularly for Effect modules:

```ts
import * as Effect from "effect/Effect"
import * as Context from "effect/Context"
import * as Option from "effect/Option"
```

These should be named imports per AGENTS.md:
```ts
import { Effect } from "effect/Effect"
```

Found in 200+ files across all packages. The `cli`, `stats`, and `core` packages are the heaviest users.

**Note:** Oxlint 1.60.0 does not have a `no-namespace` or equivalent rule to enforce this automatically. This requires manual migration.

### 3.3 Alias Imports (AGENTS.md: "Never alias imports")

**Severity: Low-Medium**

Alias imports found primarily in:
- UI components: `import { Button as Kobalte } from "@kobalte/core/button"` (~15 files)
- i18n: `import { dict as en } from "./en"` (~10 files)
- Server: `import { layer as locationLayer } from "./location"`
- Auth: `import { Config as EffectConfig } from "effect"`

**Recommendation:** Use the imported name directly. For Kobalte components, the pattern `Kobalte.Button` can be replaced with direct named imports.

### 3.4 `else` After Return (AGENTS.md: "Avoid `else` statements")

**Severity: Low-Medium**

30+ instances in core source files (excluding tests/generated). Key locations:
- `packages/opencode/src/patch/index.ts` — 4 instances
- `packages/opencode/src/provider/transform.ts` — 5 instances
- `packages/opencode/src/lsp/server.ts` — 4 instances
- `packages/opencode/src/session/prompt.ts` — 1 instance

**Recommendation:** Convert to early return pattern. Oxlint 1.60.0 does not have a `no-else-after-return` rule.

### 3.5 `try/catch` Usage (AGENTS.md: "Avoid `try`/`catch` where possible")

**Severity: Low**

Extensive `try/catch` usage throughout the codebase. Many are in error-handling paths where they're justified (JSON parsing, file I/O). However, some could be replaced with Effect's error channels:

- `packages/opencode/src/auth/index.ts:60-62` — bare `catch (err) {}` that silently swallows errors
- `packages/opencode/src/config/config.ts` — multiple `Effect.catch` pipes that could use `Effect.catchTag` for typed error handling
- `packages/opencode/src/cli/tui/validate-session.ts:19` — `catch (error)` that could use Effect error channel

### 3.6 `let` Where `const` Suffices (AGENTS.md: "Prefer `const` over `let`")

**Severity: Low**

13 instances flagged by linter in core packages. These are cases where a variable is assigned once and never reassigned.

### 3.7 Unsafe Type Assertions (`as` casts)

**Severity: Medium**

255 `no-unsafe-type-assertion` warnings and 60 `no-unnecessary-type-assertion` warnings. Key patterns:
- `as any` — 30+ instances (see section 3.1)
- `as Record<string, unknown>` — common after `JSON.parse`
- `as string` — unsafe narrowing without runtime check

**Recommendation:** Use `Schema.decodeUnknown` or type guards instead of unsafe casts, especially for `JSON.parse` results.

---

## 4. Test Coverage Analysis

### 4.1 Test File Distribution

| Metric | Count |
|--------|-------|
| Total test files (`.test.ts`) | 642 |
| Total source files (`.ts`, excluding generated/d.ts) | 2,578 |
| Test-to-source ratio | ~25% |

### 4.2 Packages Without Tests

**11 packages have zero test files:**

| Package | Risk Level | Notes |
|---------|-----------|-------|
| `server` | **HIGH** | Core architectural component — HTTP API server with auth, routing |
| `function` | Medium | Serverless function handlers |
| `effect-sqlite-node` | Medium | Node.js SQLite adapter |
| `identity` | Medium | Identity/auth service |
| `plugin` | Low | Plugin template package |
| `slack` | Low | Slack integration |
| `web` | Low | Web share component |
| `script` | Low | Build scripts |
| `containers` | Low | Container definitions |
| `docs` | Low | Documentation |
| `storybook` | Low | Storybook config |

### 4.3 Well-Tested Packages

| Package | Test Files | Notes |
|---------|-----------|-------|
| `app` | 129 | Comprehensive UI/context testing |
| `opencode` | ~80 | Good coverage of server, session, plugin, LSP |
| `core` | ~15 | Session runner, system context, plugins |
| `schema` | ~5 | Contract identity, V1 isolation |
| `client` | 4 | Contract identity tests |
| `tui` | ~15 | TUI lifecycle, keymap, sync |
| `llm` | ~20 | Provider tests with recorded scenarios |

### 4.4 Missing Edge Case Coverage

- **`packages/server`**: No tests for HTTP API routes, auth middleware, CORS, or location handling
- **`packages/core/src/session`**: Session lifecycle edge cases (interruption, crash recovery) appear untested
- **`packages/opencode/src/provider`**: Provider error handling and retry logic has limited test coverage
- **`packages/opencode/src/patch`**: Patch application edge cases (conflict resolution, partial patches)

---

## 5. Security Analysis

### 5.1 `new Function()` Usage (Code Injection Risk)

**Severity: Medium (low exploitability, debug-only)**

| File | Line | Context |
|------|------|---------|
| `packages/opencode/src/cli/cmd/debug/agent.handler.ts` | 110 | `new Function(\`return (\${trimmed})\`)()` — parses CLI `--params` as JS |
| `packages/effect-drizzle-sqlite/src/internal/drizzle-utils.ts` | 32 | `new Function("input", '"use strict"; return input;')(true)` — strict-true check |

**Recommendation:** The debug CLI usage should be replaced with `JSON.parse` only (no JS eval fallback). The drizzle-utils usage is safe but could use `=== true` comparison.

### 5.2 Auth Content Handling

**Severity: Low**

`packages/opencode/src/auth/index.ts:59-62` reads auth content from `process.env.OPENCODE_AUTH_CONTENT` with bare `JSON.parse` and a `catch (err) {}` that silently swallows errors. The auth file is written with `0o600` permissions (good).

**Recommendation:** Use `Schema.decodeUnknown` to validate the parsed JSON instead of bare `JSON.parse` + silent catch.

### 5.3 No Hardcoded Secrets Found

No hardcoded API keys, passwords, or tokens found in source files. Environment variables are used for secrets, which is correct.

---

## 6. Effect v4 Pattern Compliance

### 6.1 Service Binding (AGENTS.md: "bind services to named variables")

**PASS** — The codebase consistently uses:
```ts
const fsys = yield* FSUtil.Service
const db = yield* Database.Service
```

No instances of nested service yields like `yield* (yield* Foo.Service).bar()` found.

### 6.2 Effect Generator Usage

**PASS** — `Effect.gen(function* () { ... })` is used consistently. `Effect.fn("Domain.method")` is used for named/traced effects.

### 6.3 Error Handling

**MOSTLY PASS** — `Schema.TaggedErrorClass` is used for typed errors. Some areas use bare `Effect.die(new Error(...))` instead of typed errors, particularly in config loading.

### 6.4 Effect.forkIn

**PASS** — No usage of the non-existent `Effect.fork` or `Effect.forkDaemon` (which don't exist in Effect v4). `Effect.forkIn(scope)` is used correctly.

---

## 7. Oxlint Configuration Issues (Fixed)

### Issues Found

1. **Duplicate `options` keys** — The `.oxlintrc.json` had three `options` blocks (lines 3-5, 44-46, 47-49). JSON only keeps the last occurrence, but this was clearly a copy-paste error.
2. **Missing style guide rules** — No rules enforced `no-explicit-any`, `prefer-const`, or `no-var` from AGENTS.md.
3. **Missing `import/no-self-import` suppression** — The self-reexport pattern triggered 342 false-positive warnings.

### Fixes Applied

1. Consolidated to a single `options` block
2. Added `typescript/no-explicit-any: "warn"`
3. Added `prefer-const: "warn"`
4. Added `no-var: "warn"`
5. Added `import/no-self-import: "off"` (suppresses false positives on self-reexport pattern)
6. Added explicit `plugins` list
7. Added `src/generated` and `src/generated-effect` to `ignorePatterns`

---

## 8. Lint Warning Summary (Core Packages)

After config fixes, the linter produces **1,118 warnings** across 792 files:

| Rule | Count | AGENTS.md Reference |
|------|-------|-------------------|
| `consistent-return` | 329 | Control flow — mixed return paths |
| `no-unsafe-type-assertion` | 255 | Unsafe `as` casts |
| `no-explicit-any` | 170 | "Avoid using the `any` type" |
| `no-unused-vars` | 87 | Unused variables |
| `namespace` (star import) | 85 | "Never use star imports" |
| `no-unnecessary-type-assertion` | 60 | Redundant `as` casts |
| `restrict-template-expressions` | 16 | Unsafe template expressions |
| `no-unnecessary-type-arguments` | 15 | Redundant type args |
| `unbound-method` | 13 | Method reference without binding |
| `prefer-const` | 13 | "Prefer `const` over `let`" |
| `no-unnecessary-type-conversion` | 13 | Redundant type conversion |
| `no-base-to-string` | 10 | Calling `.toString()` on non-string |
| `no-floating-promises` | 9 | Unhandled promise |
| `no-useless-spread` | 6 | Unnecessary spread |
| Other | 19 | Various minor issues |

---

## 9. Recommendations

### High Priority
1. **Add tests for `packages/server`** — This is a critical architectural component with zero test coverage
2. **Reduce `any` usage** — Replace with `unknown` + type guards or proper interfaces
3. **Fix `consistent-return` violations** — Ensure all code paths in a function return consistently
4. **Replace `new Function()` in debug CLI** — Use `JSON.parse` only, no JS eval

### Medium Priority
5. **Migrate star imports to named imports** — Replace `import * as Effect from "effect/Effect"` with `import { Effect } from "effect/Effect"`
6. **Replace bare `JSON.parse` with `Schema.decodeUnknown`** — For all untrusted JSON input
7. **Add tests for `packages/function` and `packages/identity`**
8. **Fix silent error swallowing** — Replace `catch (err) {}` with typed error handling

### Low Priority
9. **Convert `else` after return to early returns** — 30+ instances
10. **Remove unnecessary type assertions** — 60 redundant `as` casts
11. **Fix unused variables** — 87 instances
