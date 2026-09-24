// @vitest-environment jsdom

// A class-spells job that finishes without its data event is a failed stream. It must throw so
// the proxy cache stores nothing and the import falls back to HTTP, rather than caching an empty
// spell list for the full TTL. A data event carrying an empty list is a genuine empty result.

import { runClassSpellsJob } from "../../src/muncher/spells";
import type DDBSpellSocket from "../../src/lib/streaming/DDBSpellSocket";
import type { DDBSpellEvent } from "../../src/lib/streaming/DDBSpellSocket";

type TJobSocket = Pick<DDBSpellSocket, "runJob">;

/** A socket whose job emits the given events and then completes. */
function socketEmitting(events: DDBSpellEvent[]): TJobSocket {
  return {
    runJob: async (_element, _params, options = {}) => {
      for (const event of events) options.onEvent?.(event);
      return {};
    },
  };
}

const params = { className: "Wizard", rulesVersion: "2024" };

describe("runClassSpellsJob", () => {
  it("returns the streamed spells", async () => {
    const spells = [{ definition: { name: "Fireball" } }];
    const socket = socketEmitting([{ kind: "classSpells", payload: { spells } }, { kind: "done" }]);
    await expect(runClassSpellsJob(socket, params)).resolves.toEqual(spells);
  });

  it("returns an empty list the stream actually delivered", async () => {
    const socket = socketEmitting([{ kind: "classSpells", payload: { spells: [] } }, { kind: "done" }]);
    await expect(runClassSpellsJob(socket, params)).resolves.toEqual([]);
  });

  it("throws when the job finished without a spells payload", async () => {
    const socket = socketEmitting([{ kind: "started" }, { kind: "done" }]);
    await expect(runClassSpellsJob(socket, params)).rejects.toThrow("without a spells payload");
  });

  it("throws when the spells payload is not a list", async () => {
    const socket = socketEmitting([{ kind: "classSpells", payload: {} }, { kind: "done" }]);
    await expect(runClassSpellsJob(socket, params)).rejects.toThrow("without a spells payload");
  });

  it("passes a job failure through", async () => {
    const socket: TJobSocket = {
      runJob: async () => {
        throw new Error("job timed out");
      },
    };
    await expect(runClassSpellsJob(socket, params)).rejects.toThrow("job timed out");
  });
});
