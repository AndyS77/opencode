# Weekend-Mode Execution Audit Report

**Date:** 2026-08-11
**Auditor:** Continuous Improvement Agent
**Scope:** Weekend-mode execution handling three tasks: (1) Deep code review, (2) Linting setup, (3) .gitignore changes
**Repository:** C:\Repos\opencode

---

## 1. Executive Summary

A weekend-mode task was dispatched to handle three tasks. The `agent-dispatch` tool correctly recommended `@weekend-mode` with subagents `backlog-planning`, `feature-automation`, `bugfix-automation`, `debt-remediation`, `merge-agent`, and `continuous-improvement`. However, **the actual execution was performed by a single `@general` agent** — none of the six recommended subagents were dispatched.

Despite the subagent bypass, the work product quality is **moderate-to-good**: the code review report is comprehensive (311 lines), the linting configuration is functional, and the .gitignore changes are correct. However, the execution violated multiple process requirements: no TDD cycle, no pre-merge governance, no independent code review, no branch discipline, and no hook execution.

**Severity: HIGH** — This is the third documented occurrence of orchestrator bypass (prior: broker repo, oc-agents repo). The root cause remains the same: no enforcement mechanism prevents the general agent from executing tasks that have dedicated orchestrators.

| Dimension | Status | Detail |
|-----------|--------|--------|
| Subagent usage | **FAIL** | 0 of 6 recommended subagents dispatched |
| Pre-merge review | **FAIL** | No merge-agent invoked, no governance checks |
| TDD compliance | **FAIL** | No tests written for any task |
| Branch discipline | **PARTIAL** | No branch created (correct: no direct commits to default) but no commits at all |
| Hook execution | **N/A** | No commits → no hooks triggered |
| Task 1 (code review) | **PASS (quality)** | Comprehensive report, but no independent validation |
| Task 2 (linting) | **PASS (functional)** | Config works, but no TDD, no review, no governance |
| Task 3 (.gitignore) | **PASS (minimal)** | Correct changes, but no review |

---

## 2. Subagent Usage: Expected vs. Actual

### 2.1 What the Dispatcher Recommended

The `agent-dispatch` tool returned:
- **Orchestrator:** `@weekend-mode`
- **Sub-agents:** `backlog-planning`, `feature-automation`, `bugfix-automation`, `debt-remediation`, `merge-agent`, `continuous-improvement`

This matches the agent-selection-matrix entry for weekend-mode:
> | Weekend mode (autonomous) | — | `@weekend-mode` | backlog-planning, feature-automation, bugfix-automation, debt-remediation, merge-agent, continuous-improvement | For interactive work |

### 2.2 What Actually Happened

A single `@general` agent executed all three tasks sequentially. No subagent was dispatched for any task. This is a direct violation of the AGENTS.md mandate:

> **Before starting ANY task, you MUST call the agent-dispatch tool** [...] **Do NOT skip this step. Do NOT fall back to @general without dispatching first.**

### 2.3 Per-Task Expected Subagent Mapping

| Task | Expected Pipeline | Expected Subagents | Actual |
|------|------------------|-------------------|--------|
| **Deep code review** | `@code-review` (autonomous: `@pull-request-review`) | code-reviewer, architecture-guardian, qa-validator, security-reviewer, clean-architecture-specialist | `@general` (none dispatched) |
| **Linting setup** | `@feature-automation` (feature task) OR `@governance-engineer` (governance infra) | feature-planner, code-reviewer, qa-validator, architecture-guardian, merge-agent | `@general` (none dispatched) |
| **.gitignore changes** | `@debt-remediation` (tech debt / config debt) | debt-triage, architecture-guardian, clean-architecture-specialist, code-reviewer, merge-agent | `@general` (none dispatched) |

### 2.4 Subagents That Should Have Been Dispatched Per Task

**Task 1 — Deep Code Review:**
- `@code-reviewer` — Multi-dimensional code quality review (correctness, maintainability, standards)
- `@architecture-guardian` — Module boundary validation, dependency direction checks
- `@qa-validator` — Test coverage assessment, edge case identification
- `@security-reviewer` — Security vulnerability audit, OWASP Top 10, injection detection
- `@clean-architecture-specialist` — Clean architecture compliance validation

**Task 2 — Linting Setup:**
- `@feature-planner` — Break down linting setup into implementable tasks
- `@code-reviewer` — Review the .oxlintrc.json configuration for correctness
- `@architecture-guardian` — Validate that lint rules align with architecture principles
- `@merge-agent` — Pre-merge governance checks before committing lint config

**Task 3 — .gitignore Changes:**
- `@debt-triage` — Assess the .gitignore configuration debt
- `@code-reviewer` — Review the .gitignore changes for correctness
- `@merge-agent` — Pre-merge governance checks

**All Tasks (Weekend-Mode Orchestration):**
- `@backlog-planning` — Should have discovered and prioritized these tasks from the backlog
- `@merge-agent` — Should have performed governance checks on each completed task
- `@continuous-improvement` — Should have held a retrospective at the end

### 2.5 Gap Assessment

| Subagent | Dispatched? | Impact of Skipping |
|----------|------------|-------------------|
| backlog-planning | No | No task prioritization, no parallelization plan, no dependency analysis |
| feature-automation | No | No TDD cycle, no pipeline discipline, no convergence loop |
| bugfix-automation | N/A | No bug tasks in this batch |
| debt-remediation | No | No triage, no architecture validation, no ROI analysis for .gitignore changes |
| merge-agent | No | **No pre-merge governance checks on any task** |
| continuous-improvement | No | No retrospective (this audit fills that gap) |
| code-reviewer | No | No independent code quality review of linting config or .gitignore changes |
| architecture-guardian | No | No architecture validation of linting rules |
| qa-validator | No | No test coverage assessment |
| security-reviewer | No | No security review of the code review findings (e.g., `new Function()` usage) |

---

## 3. Missing Subagent Identification

### 3.1 Agents That Exist but Were Not Used

The agent registry contains 83 agents (37 orchestrators + 46 sub-agents). The following relevant agents exist but were not dispatched:

| Agent | File | Why It Should Have Been Used |
|-------|------|---------------------------|
| `@code-reviewer` | `agents/code-reviewer.md` | Independent code quality review of all changes |
| `@architecture-guardian` | `agents/architecture-guardian.md` | Validate lint rules align with architecture |
| `@qa-validator` | `agents/qa-validator.md` | Test coverage assessment for linting config |
| `@security-reviewer` | `agents/security-reviewer.md` | Security audit (the code review found `new Function()` usage) |
| `@merge-agent` | `agents/merge-agent.md` | Pre-merge governance — the most critical skipped step |
| `@governance-engineer` | `agents/governance-engineer.md` | Linting config IS governance infrastructure |
| `@debt-triage` | (via debt-remediation) | Should triage the .gitignore configuration debt |
| `@process-guardian` | `agents/process-guardian.md` | Should enforce TDD and branch discipline |

### 3.2 Proposed New Subagents

#### Proposal A: `@linting-specialist` (Sub-agent)

**Justification:** Linting configuration is a recurring task that requires deep knowledge of linter capabilities, rule interactions, and project-specific suppressions. The code review found that oxlint 1.60.0 lacks `no-else-after-return` and `import/no-namespace` rules — this is exactly the kind of linter-specific expertise that a dedicated agent would track.

**Scope:**
- Configure linter rules (oxlint, eslint, biome, etc.)
- Map project style guide rules to linter rules
- Identify gaps where linter rules don't exist for style guide requirements
- Recommend rule severity levels (warn vs. error)
- Track linter version changes and new rule availability
- Suppress false positives with documented justifications

**Permissions:** `read: allow, grep: allow, edit: allow, write: allow, bash: allow`
**Tier:** complex (requires deep reasoning about rule interactions)

#### Proposal B: `@config-manager` (Sub-agent)

**Justification:** Configuration file management (.gitignore, tsconfig, turbo.json, package.json scripts) has no dedicated agent. The general agent handled this ad hoc. A dedicated agent would ensure consistency, track config drift, and validate that config changes align with project conventions.

**Scope:**
- Manage .gitignore, .gitignore_local, and ignore patterns
- Manage tsconfig.json, turbo.json, and build configuration
- Manage package.json scripts (lint, test, build, typecheck)
- Track config file changes across packages (monorepo consistency)
- Validate config changes don't break existing workflows

**Permissions:** `read: allow, grep: allow, edit: allow, write: allow, bash: allow`
**Tier:** fast (mechanical config management)

#### Proposal C: `@review-synthesizer` (Sub-agent)

**Justification:** The code review report was produced by a single agent. A multi-agent review (code-reviewer + security-reviewer + architecture-guardian + qa-validator) produces separate findings that need consolidation into a unified report with deduplicated findings and severity ranking. The weekend-mode orchestrator mentions this consolidation step but has no dedicated agent for it.

**Scope:**
- Collect findings from multiple review agents
- Deduplicate overlapping findings
- Rank by severity (Critical > High > Medium > Low)
- Produce a unified review report
- Identify cross-cutting patterns across findings

**Permissions:** `read: allow, grep: allow, edit: deny` (analysis only)
**Tier:** complex (requires judgment to synthesize and rank)

### 3.3 Gap: No Orchestrator Bypass Detection

**Current state:** The `agent-dispatch` tool recommends an orchestrator, but nothing prevents the calling agent from ignoring the recommendation and using `@general` instead. This is the third documented occurrence of this bypass pattern.

**Proposed mechanism:** A `pre-task` hook or `agent-dispatch` plugin enhancement that:
1. Logs the dispatch recommendation
2. If `@general` is used for a task type that has a dedicated orchestrator, emits an advisory warning
3. Tracks bypass rate in the hook execution log for continuous-improvement analysis

This would not block execution (advisory only, per continuous-improvement constraints) but would make the bypass visible and trackable.

---

## 4. Workflow Compliance Audit

### 4.1 Pre-Merge Review — **NOT EXECUTED** (CRITICAL)

**Expected:** The merge-agent should have been invoked for each completed task with the prompt:
> "Merge Agent, perform governance checks for task `<id>` on branch `<branch>`. Verify: backlog status is done/resolved, TDD commits present (RED/GREEN/REFACTOR), quality gates passed, AI commit attribution present (Co-Authored-By trailer). Report merge readiness: ready or blocked."

**Actual:** No merge-agent was dispatched. No governance checks were performed. No merge readiness verdict was produced.

**Impact:** All three tasks' outputs are uncommitted and unreviewed. The linting configuration changes (which affect all packages) were never validated for correctness or side effects. The .gitignore changes (which affect repository behavior) were never reviewed.

**Root cause:** The general agent bypassed the entire weekend-mode pipeline, which would have included merge-agent invocation in Phase 3 (Sequential Merge).

### 4.2 TDD Workflow — **NOT FOLLOWED** (HIGH)

**Expected:** Per the feature-automation pipeline, each task should follow RED → GREEN → REFACTOR with commit checkpoints. Per the process-guardian, code changes without matching test files are TDD violations.

**Actual:**
- Task 1 (code review): No tests applicable (review report, not code change)
- Task 2 (linting): No tests written for linting configuration. No test to verify the linter config is valid JSON, that rules are correctly specified, or that ignore patterns work as expected.
- Task 3 (.gitignore): No tests applicable (config file, not code)

**Impact:** The linting configuration has no automated validation. If the .oxlintrc.json is malformed or contains conflicting rules, there's no test to catch it.

### 4.3 Process Guardian Rules — **NOT CHECKED** (HIGH)

**Expected:** The process-guardian should validate:
1. TDD compliance (code changes have matching test files)
2. Branch protection (no direct commits to protected branches)
3. Hook bypasses (no `--no-verify` without justification)
4. Coverage thresholds (minimum 80%)

**Actual:** No process-guardian was invoked. The rules were not checked.

**Mitigating factor:** No commits were made, so branch protection and hook bypass rules were not violated in practice. However, the lack of process-guardian validation means the work is unvalidated.

### 4.4 Branch Discipline — **PARTIALLY CORRECT** (MEDIUM)

**Expected:** The weekend-mode orchestrator creates feature/fix/chore branches for each task and commits work to those branches.

**Actual:** No branch was created. All changes are uncommitted in the working tree on the default branch.

**Assessment:**
- **Positive:** No direct commits to the default branch (which would violate branch protection)
- **Negative:** No commits at all means the work is not preserved. A `git stash` or branch switch would lose all changes.
- **Negative:** No branch means no merge-agent governance, no code review via `git diff develop..HEAD`, no hook execution.

### 4.5 Hook Execution — **NOT TRIGGERED** (MEDIUM)

**Expected:** Pre-commit hooks should run on every commit. Pre-push hooks should run on every push. All hooks log to `.git/hook-execution.log`.

**Actual:** No hook execution log exists (`Test-Path .git/hook-execution.log` = False). No hooks were triggered because no commits were made.

**Impact:** Hook effectiveness cannot be evaluated (Part C of the continuous-improvement process). This is a data gap for the hook effectiveness audit.

### 4.6 AI Commit Attribution — **N/A**

No commits were made, so no Co-Authored-By trailers were needed. However, if commits had been made, the `commit-msg` hook (TD-020, resolved) would have enforced the trailer.

### 4.7 Summary of Skipped Workflow Steps

| Step | Weekend-Mode Phase | Executed? | Impact |
|------|-------------------|-----------|--------|
| Run manifest creation | Phase 1: Bootstrap | No | No state tracking, no crash recovery |
| Backlog planning delegation | Phase 1: Bootstrap | No | No task prioritization |
| Parallel task dispatch | Phase 2: Parallel Dispatch | No | Sequential execution, no parallelism |
| Pipeline routing (feature/debt) | Phase 2: Parallel Dispatch | No | All tasks through general agent |
| TDD cycle | Phase 2 (via pipeline) | No | No test validation |
| Code review | Phase 2 (via pipeline) | No | No independent review |
| Architecture validation | Phase 2 (via pipeline) | No | No architecture check |
| Merge queue | Phase 3: Sequential Merge | No | No merge governance |
| Merge-agent governance | Phase 3: Sequential Merge | No | **No pre-merge checks** |
| Stop condition evaluation | Phase 4: Iteration | No | No safety rails |
| Retrospective | Phase 5: Finalization | No (this audit fills gap) | No lessons captured |
| Documentation debt tracking | Phase 5: Finalization | No | No doc gaps tracked |

---

## 5. Task Completeness Assessment

### 5.1 Task 1: Deep Code Review — **COMPLETED, Quality: GOOD**

**File:** `knowledge/code-review-2026-08-11.md` (311 lines)

**What was done well:**
- Comprehensive scope: all 7+ packages covered
- Architecture compliance: dependency direction verified (6 checks, all PASS)
- Anti-pattern analysis: 7 categories analyzed with file-level detail
- Test coverage: per-package test file counts, 11 packages with zero tests identified
- Security: `new Function()` usage identified, auth handling assessed, no hardcoded secrets found
- Effect v4 compliance: service binding, generator usage, error handling checked
- Lint config issues: duplicate `options` blocks identified and fixed

**What was missing:**
- No independent security-reviewer pass (the security section is brief compared to a dedicated OWASP audit)
- No architecture-guardian validation (architecture compliance was self-assessed, not independently verified)
- No qa-validator test coverage assessment (test counts are raw, no gap analysis with recommended tests)
- No formal review tracker entry (no BUG-### or TD-### entries created for findings)
- The 11 packages with zero tests should have generated TD-### entries in tech-debt.md

**Completeness score: 8/10** — Thorough content, but lacks independent validation and tracker entries.

### 5.2 Task 2: Linting Setup — **COMPLETED, Quality: ADEQUATE**

**Files modified:**
- `.oxlintrc.json` — Fixed 3 duplicate `options` blocks, added AGENTS.md rules, added ignore patterns
- `turbo.json` — Added `"lint": {}` task
- `packages/core/package.json` — Added `"lint": "oxlint src"`
- `packages/opencode/package.json` — Added `"lint": "oxlint src"`
- `packages/schema/package.json` — Added `"lint": "oxlint src"`
- `packages/protocol/package.json` — Added `"lint": "oxlint src"`
- `packages/server/package.json` — Added `"lint": "oxlint src"`
- `packages/client/package.json` — Added `"lint": "oxlint src"`

**File created:**
- `docs/linting.md` — 91 lines documenting linting setup, rules, suppressions, limitations

**What was done well:**
- Duplicate `options` blocks fixed (was a real JSON validity issue)
- AGENTS.md style guide rules mapped to linter rules (no-explicit-any, prefer-const, no-var)
- False positive suppression for self-reexport pattern with documented justification
- Limitations documented (oxlint 1.60.0 lacks no-else-after-return, import/no-namespace)
- Generated code properly excluded from linting
- Documentation is clear and comprehensive

**What was missing:**
- **No root-level `lint` script** — The root package.json (if it exists) doesn't have a `lint` script. The docs say `bun run lint` from root, but there's no root script. Only turbo has `lint` task. Users need `bun turbo lint` or per-package `cd packages/X && bun run lint`.
- **No test for lint config** — No validation that .oxlintrc.json is valid JSON, that rules exist in oxlint, or that ignore patterns work
- **No lint script in other packages** — 20+ packages exist; only 6 got lint scripts. Packages like `tui`, `app`, `cli`, `llm`, `desktop` were not given lint scripts
- **No `lint:fix` or `lint:check` variant** — Only `oxlint src` (which auto-fixes by default in some configs). No explicit `--fix` or `--deny-warnings` flags
- **No code review of the config** — The config was not reviewed by @code-reviewer or @architecture-guardian
- **No merge-agent governance** — No pre-merge checks performed

**Completeness score: 6/10** — Functional but incomplete (6 of 20+ packages, no root script, no tests, no review).

### 5.3 Task 3: .gitignore Changes — **COMPLETED, Quality: MINIMAL**

**Files modified:**
- `.gitignore` — Added 3 lines: comment + `.gitignore_local` entry + blank line
- `.gitignore_local` — Created with 17 lines of local-only ignore patterns

**What was done well:**
- `.gitignore_local` is correctly gitignored (so local exclusions stay private)
- Content is sensible: build artifacts, editor files, local dev files, temp/scratch
- Clear documentation comment in .gitignore_local explaining its purpose

**What was missing:**
- **No review** — Changes not reviewed by @code-reviewer or @debt-triage
- **No governance** — No merge-agent pre-merge checks
- **No documentation** — No explanation of when/why to use .gitignore_local vs .gitignore (beyond the inline comment)
- **Redundancy** — `.gitignore_local` duplicates several patterns already in `.gitignore` (playground, tmp, .idea, logs/). This is intentional (local-only override) but should be documented.
- **Missing patterns** — `.gitignore_local` could include machine-specific paths like `*.local.ts`, `.env.local`, etc.

**Completeness score: 5/10** — Correct but minimal, no review or governance.

### 5.4 Uncommitted Work Risk

All changes are uncommitted in the working tree:

```
 M .gitignore
 M .oxlintrc.json
 M packages/client/package.json
 M packages/core/package.json
 M packages/opencode/package.json
 M packages/protocol/package.json
 M packages/schema/package.json
 M packages/server/package.json
 M turbo.json
?? BRIEFING-CUSTOM-TOOL-BUG.md
?? docs/
?? knowledge/
```

**Risk:** A `git checkout`, `git stash`, or `git reset` would lose all work. The `BRIEFING-CUSTOM-TOOL-BUG.md` file appears to be from a separate task (bug #35498 investigation) and should be evaluated separately.

---

## 6. Improvement Recommendations

### 6.1 Immediate Actions (for this run)

1. **Commit the work** — Create a branch (e.g., `linting-setup`), stage the changes, and commit with proper Co-Authored-By trailer. Run pre-commit hooks.
2. **Add lint scripts to remaining packages** — 14+ packages still lack lint scripts (tui, app, cli, llm, desktop, etc.)
3. **Add root-level lint script** — Add `"lint": "oxlint ."` or `"lint": "turbo lint"` to root package.json
4. **Create tech-debt entries** — The code review identified 11 packages with zero tests and 170 `any` usages. These should be TD-### entries in tech-debt.md.
5. **Review the linting config** — Dispatch @code-reviewer to review .oxlintrc.json for correctness and completeness

### 6.2 Process Improvements (for future weekend-mode runs)

1. **Enforce orchestrator selection** — The `agent-dispatch` tool should log its recommendation. If `@general` is used for a task type with a dedicated orchestrator, emit an advisory warning. Track bypass rate.

2. **Add a pre-task validation step** — Before any task execution, verify that the recommended orchestrator was actually dispatched. If not, require explicit justification.

3. **Weekend-mode bootstrap check** — The weekend-mode orchestrator should verify on startup that it was actually invoked (not bypassed by general agent). If bypassed, it should emit a warning and document the bypass.

4. **Create missing subagents** — Implement the three proposed subagents:
   - `@linting-specialist` — Linter configuration expert
   - `@config-manager` — Configuration file management
   - `@review-synthesizer` — Multi-agent review consolidation

5. **Expand lint script coverage** — Create a checklist item in the linting setup workflow: "Add lint script to ALL packages with src/ directory, not just core packages."

6. **Add lint config validation test** — Create a test that validates .oxlintrc.json is valid JSON, contains required plugins, and that referenced rules exist in the installed oxlint version.

### 6.3 Structural Improvements

1. **opencode.json routing** — Create a project-level `opencode.json` that routes task types to orchestrators. This was previously identified as IDEA-051 and TD-023 (resolved at the config level) but no project-level routing config was created for the opencode repo itself.

2. **Hook telemetry** — Install hooks in this repo (`.git/hook-execution.log` doesn't exist). The hooks are defined in the agent config but not installed in this repository. This means hook effectiveness cannot be audited.

3. **Knowledge store initialization** — No project-local knowledge store exists at `.opencode/knowledge/`. Create it for project-specific lessons, patterns, and anti-patterns.

---

## 7. Pattern: Weekend-Mode Orchestrator Bypass (Third Occurrence)

### Pattern Details

| Occurrence | Date | Repository | Agent Used | Tasks Affected |
|-----------|------|-----------|------------|----------------|
| 1st | 2026-08-11 | C:\Repos\broker | `@general` (Claude Haiku) | 40+ commits, 3 branches |
| 2nd | 2026-08-11 | C:\Repos\oc-agents | `@general` | 3 tasks (IDEA-043, 045, 046) |
| 3rd | 2026-08-11 | C:\Repos\opencode | `@general` | 3 tasks (review, linting, .gitignore) |

### Root Cause (Consistent Across All Three)

1. **No enforcement mechanism** — The `agent-dispatch` tool recommends but does not enforce. The calling agent can ignore the recommendation.
2. **No bypass detection** — No hook, no log, no telemetry tracks when `@general` is used instead of a recommended orchestrator.
3. **No project-level routing** — No `opencode.json` routes task types to orchestrators at the project level.
4. **Cognitive path of least resistance** — The general agent defaults to doing the work itself rather than delegating, especially when the task seems straightforward.

### Impact (Consistent Across All Three)

- No TDD enforcement (no RED-GREEN-REFACTOR cycle)
- No independent code review (implementer reviews own work)
- No merge governance (no merge-agent verdict)
- No provenance audit trail (no Co-Authored-By on commits — though in this case, no commits were made)
- No retrospective (no lessons captured — this audit fills the gap for occurrence 3)

### Recommended Fix (Same as TD-023, But Now Needs Enforcement)

TD-023 was resolved at the config level (agent-selection-matrix.md created, provenance checks added to hooks). But the hooks are not installed in this repo, and the config-level fix is advisory only. The fix needs to be:

1. **Install hooks in this repo** — The hooks exist in the agent config but are not installed in C:\Repos\opencode
2. **Add bypass detection to agent-dispatch** — Log when the recommended orchestrator is not used
3. **Create opencode.json** — Project-level routing config for this repo

---

## 8. Hook Effectiveness Evaluation

### Part C: Hook Telemetry Analysis

**Status: CANNOT EVALUATE — No hook execution log exists.**

The file `.git/hook-execution.log` does not exist in this repository. This means:
- Hooks are defined in the agent config (`C:\Users\andrseli\.config\opencode\hooks\`)
- Hooks are NOT installed in this repository (`.git/hooks/` likely contains only default samples)
- No hook has ever fired in this repository
- Bypass rate (AC1), false-positive rate (AC2), obsolete hook detection (AC3), and performance correlation (AC4) cannot be computed

**Recommendation:** Install hooks in this repository using the install script from the agent config. This will enable hook telemetry for future audits.

---

## 9. Web Knowledge Expiry Check

### Part A: Expiry Report

- **Total web-knowledge entries:** 0
- **Current:** 0
- **Stale (expiring within 7 days):** 0
- **Expired (re-search needed):** 0

The web-knowledge index (`knowledge/web-knowledge-index.md`) has no active entries. No re-search is needed.

---

## 10. Knowledge Store Updates

### New entries written to:
- **Project-local:** `knowledge/weekend-mode-audit-2026-08-11.md` (this file)
- **Global:** `knowledge/anti-patterns.md` — New anti-pattern entry (see below)
- **Global:** `knowledge/lessons-learned.md` — New lesson entry (see below)
- **Global:** `knowledge/patterns.md` — New pattern observation (see below)

### Anti-Pattern Added

**Weekend-Mode Orchestrator Bypass via @general Agent (2026-08-11, 3rd occurrence)**
- Symptom: agent-dispatch recommends @weekend-mode with 6 subagents; execution uses @general with 0 subagents
- Root cause: No enforcement mechanism, no bypass detection, no project-level routing
- Impact: No TDD, no independent review, no merge governance, no provenance

### Lesson Added

**Orchestrator Bypass Is the Dominant Failure Mode (2026-08-11)**
- Three occurrences in one day across three repositories
- The pattern is consistent: dispatch recommends, general agent ignores
- Config-level fixes (agent-selection-matrix, provenance hooks) are necessary but insufficient
- Need: runtime enforcement or at minimum bypass detection with telemetry

### Pattern Observation

**Pattern: Orchestrator Bypass Rate**
- Observation count: 3 (threshold for formal pattern: 3+)
- All occurrences on 2026-08-11
- Repositories: broker, oc-agents, opencode
- Consistent root cause: no enforcement mechanism

---

## 11. Proposed Tech Debt Entries

### TD-028: No hooks installed in opencode repository

- **Date:** 2026-08-11
- **Source:** continuous-improvement weekend-mode audit
- **Category:** config
- **Description:** Hooks are defined in `C:\Users\andrseli\.config\opencode\hooks\` but not installed in the opencode repository. No `.git/hook-execution.log` exists. Hook effectiveness cannot be audited.
- **Impact:** 3 (hook telemetry, TDD enforcement, provenance checks all non-functional)
- **Effort:** 1 (S — run install script)
- **Priority:** 9
- **Status:** proposed

### TD-029: Lint scripts missing in 14+ packages

- **Date:** 2026-08-11
- **Source:** continuous-improvement weekend-mode audit
- **Category:** code
- **Description:** Only 6 of 20+ packages have lint scripts. Packages without lint: tui, app, cli, llm, desktop, ui, session-ui, enterprise, codemode, function, effect-drizzle-sqlite, effect-sqlite-node, web, slack, plugin, storybook, script, sdk-next, httpapi-codegen, http-recorder.
- **Impact:** 2 (inconsistent linting across monorepo)
- **Effort:** 1 (S — add `"lint": "oxlint src"` to each package.json)
- **Priority:** 8
- **Status:** proposed

### TD-030: No root-level lint script

- **Date:** 2026-08-11
- **Source:** continuous-improvement weekend-mode audit
- **Category:** config
- **Description:** The root package.json has no `lint` script. Documentation says `bun run lint` but there's no root script. Users must use `bun turbo lint` or navigate to individual packages.
- **Impact:** 1 (usability friction)
- **Effort:** 1 (S — add `"lint": "turbo lint"` to root package.json)
- **Priority:** 4
- **Status:** proposed

### TD-031: Code review findings not tracked as tech-debt entries

- **Date:** 2026-08-11
- **Source:** continuous-improvement weekend-mode audit
- **Category:** process
- **Description:** The code review report identifies 170 `any` usages, 11 packages with zero tests, 329 consistent-return violations, and `new Function()` usage. None of these were registered as TD-### entries in tech-debt.md. Findings are documented but not actionable without tracker entries.
- **Impact:** 3 (findings are invisible to the debt-remediation pipeline)
- **Effort:** 2 (M — create TD entries for each finding category)
- **Priority:** 6
- **Status:** proposed

---

## 12. Conclusion

The weekend-mode execution produced functional work products but violated every process safeguard designed to ensure quality in autonomous execution. The root cause — orchestrator bypass via `@general` agent — is now a documented pattern with three occurrences. The fix requires runtime enforcement, not just configuration.

**Immediate priority:** Install hooks, commit the work with proper governance, and create tech-debt entries for the code review findings.

**Strategic priority:** Implement bypass detection in the `agent-dispatch` tool and create the three proposed subagents (`@linting-specialist`, `@config-manager`, `@review-synthesizer`) to fill the subagent lineup gaps.
