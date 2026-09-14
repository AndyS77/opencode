import { afterEach, describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { Global } from "@opencode-ai/core/global"
import { Hash } from "@opencode-ai/core/util/hash"
import fs from "fs/promises"
import path from "path"
import { Effect, Layer } from "effect"
import { Snapshot } from "../../src/snapshot"
import { InstanceRef } from "../../src/effect/instance-ref"
import { disposeAllInstances, testInstanceStoreLayer, TestInstance } from "../fixture/fixture"
import { testEffect } from "../lib/effect"

const it = testEffect(
  Layer.mergeAll(LayerNode.compile(LayerNode.group([Snapshot.node, FSUtil.node])), testInstanceStoreLayer),
)

afterEach(async () => {
  await disposeAllInstances()
})

const write = (file: string, content: string | Uint8Array) =>
  FSUtil.Service.use((fs) => fs.writeWithDirs(file, content))

const corruptIndex = (gitdir: string) =>
  Effect.promise(() => fs.writeFile(path.join(gitdir, "index"), "CORRUPT INDEX DATA"))

const removeGitdir = (gitdir: string) =>
  Effect.promise(() => fs.rm(gitdir, { recursive: true, force: true }))

describe("snapshot circuit breaker", () => {
  it.instance(
    "trips after 3 consecutive failures and short-circuits subsequent calls",
    Effect.gen(function* () {
      const dir = yield* TestInstance
      const ctx = yield* InstanceRef
      const snapshot = yield* Snapshot.Service
      const gitdir = path.join(Global.Path.data, "snapshot", ctx.project.id, Hash.fast(ctx.worktree))

      yield* write(path.join(dir.directory, "test.txt"), "initial")
      const first = yield* snapshot.track()
      expect(first).toBeTruthy()

      yield* write(path.join(dir.directory, "test.txt"), "changed")
      yield* corruptIndex(gitdir)

      expect(yield* snapshot.track()).toBeUndefined()
      expect(yield* snapshot.track()).toBeUndefined()
      expect(yield* snapshot.track()).toBeUndefined()

      const r4 = yield* snapshot.track()
      expect(r4).toBeUndefined()

      const patch = yield* snapshot.patch(first!)
      expect(patch.files).toHaveLength(0)

      const diff = yield* snapshot.diff(first!)
      expect(diff).toBe("")
    }),
    { git: true },
    60000,
  )

  it.instance(
    "resets failure counter on success before tripping",
    Effect.gen(function* () {
      const dir = yield* TestInstance
      const ctx = yield* InstanceRef
      const snapshot = yield* Snapshot.Service
      const gitdir = path.join(Global.Path.data, "snapshot", ctx.project.id, Hash.fast(ctx.worktree))

      yield* write(path.join(dir.directory, "test.txt"), "initial")
      const first = yield* snapshot.track()
      expect(first).toBeTruthy()

      yield* write(path.join(dir.directory, "test.txt"), "changed")
      yield* corruptIndex(gitdir)

      expect(yield* snapshot.track()).toBeUndefined()
      expect(yield* snapshot.track()).toBeUndefined()

      yield* removeGitdir(gitdir)
      yield* write(path.join(dir.directory, "test.txt"), "changed-again")
      expect(yield* snapshot.track()).toBeTruthy()

      yield* corruptIndex(gitdir)
      expect(yield* snapshot.track()).toBeUndefined()
      expect(yield* snapshot.track()).toBeUndefined()

      yield* removeGitdir(gitdir)
      yield* write(path.join(dir.directory, "test.txt"), "final")
      expect(yield* snapshot.track()).toBeTruthy()
    }),
    { git: true },
    60000,
  )
})
