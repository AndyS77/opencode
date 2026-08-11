# Linting Setup

## Overview

The project uses [oxlint](https://oxc.rs/) (v1.60.0) for linting, configured via `.oxlintrc.json` at the repository root.

## Running the Linter

### From the repository root (all files):
```bash
bun run lint
```

### From a specific package:
```bash
cd packages/core && bun run lint
cd packages/opencode && bun run lint
cd packages/schema && bun run lint
cd packages/protocol && bun run lint
cd packages/server && bun run lint
cd packages/client && bun run lint
```

### Via turbo (parallel across packages):
```bash
bun turbo lint
```

## Configuration

The `.oxlintrc.json` file enforces the following AGENTS.md style guide rules:

| Rule | Level | AGENTS.md Reference |
|------|-------|-------------------|
| `typescript/no-explicit-any` | warn | "Avoid using the `any` type" |
| `prefer-const` | warn | "Prefer `const` over `let`" |
| `no-var` | warn | Use `const` or `let` instead of `var` |
| `typescript/no-floating-promises` | warn | Catch unhandled promises |
| `typescript/no-misused-spread` | warn | Warn on spreading non-plain objects |
| `typescript/no-base-to-string` | warn | Warn on `.toString()` of non-string types |

### Suppressed Rules

The following rules are disabled because they conflict with intentional patterns:

| Rule | Reason |
|------|--------|
| `import/no-self-import` | False positives on the self-reexport pattern (`export * as Foo from "./foo"`) |
| `require-yield` | Effect's `function*` closures don't always yield |
| `no-unassigned-vars` | SolidJS uses `let ref: T \| undefined` for JSX ref bindings |
| `no-unused-expressions` | SolidJS reads properties inside `createEffect` for reactive tracking |
| `no-control-regex` | Intentional ANSI escape / null byte matching |
| `triple-slash-reference` | SST and plugin tools require triple-slash references |
| `no-shadow` | Effect's nested `function*` closures inherently shadow outer scope |
| `unicorn/consistent-function-scoping` | Namespace-heavy codebase makes this too noisy |

### Limitations

Oxlint 1.60.0 does not support the following rules from the AGENTS.md style guide:

- **`import/no-namespace`** (star imports) — `import * as Foo` should be `import { Foo }`. Enforced by manual review.
- **`no-else-after-return`** — `else` after `return` should be converted to early returns. Enforced by manual review.
- **Alias import detection** — `import { foo as bar }` should use the original name. Enforced by manual review.

## Ignore Patterns

The linter ignores:
- `**/node_modules`
- `**/dist`
- `**/.build`
- `**/.sst`
- `**/*.d.ts`
- `**/sdk.gen.ts`
- `**/src/generated` (generated SDK code)
- `**/src/generated-effect` (generated Effect SDK code)

## Package-Level Lint Scripts

The following packages have `lint` scripts added:
- `packages/core` — `oxlint src`
- `packages/opencode` — `oxlint src`
- `packages/schema` — `oxlint src`
- `packages/protocol` — `oxlint src`
- `packages/server` — `oxlint src`
- `packages/client` — `oxlint src`

The `turbo.json` includes a `lint` task for parallel execution across packages.

## Current Warning Count

As of 2026-08-11, the core packages produce **1,118 warnings** across 792 files. See `knowledge/code-review-2026-08-11.md` for the detailed breakdown.
