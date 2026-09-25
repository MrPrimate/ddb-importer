// How a streaming job fails decides whether the importer latches streaming off for the session:
// only an unusable endpoint (connect error, refused start) is a StreamUnavailableError. A job that
// ran and ended badly is a plain Error, and non-fatal error events are counted so the caller can
// refuse to cache a possibly incomplete payload.

import DDBSpellSocket from "../../src/lib/streaming/DDBSpellSocket";
import { StreamUnavailableError } from "../../src/lib/streaming/BaseStreamSocket";

type TAck = (res: unknown) => void;

/** A spell socket whose `start` ack is answered with `startAck`. */
function socketWithStart(startAck: unknown): DDBSpellSocket {
  const socket = new DDBSpellSocket("https://proxy.example");
  socket.socket = {
    emit: (_event: string, _payload: unknown, ack: TAck) => ack(startAck),
  } as unknown as DDBSpellSocket["socket"];
  return socket;
}

describe("BaseStreamSocket.runJob failures", () => {
  it("rejects a refused start with StreamUnavailableError", async () => {
    const socket = socketWithStart({ ok: false, message: "no such element" });
    await expect(socket.runJob("class-spells", { className: "Wizard", rulesVersion: "2024" }))
      .rejects.toBeInstanceOf(StreamUnavailableError);
  });

  it("rejects a connect error with StreamUnavailableError", async () => {
    const socket = socketWithStart({ ok: true, jobId: "j" });
    const job = socket.runJob("class-spells", { className: "Wizard", rulesVersion: "2024" });
    socket.handlers?.onConnectError?.(new Error("xhr poll error"));
    await expect(job).rejects.toBeInstanceOf(StreamUnavailableError);
  });

  it("rejects a fatal job event with a plain Error", async () => {
    const socket = socketWithStart({ ok: true, jobId: "j" });
    const job = socket.runJob("class-spells", { className: "Wizard", rulesVersion: "2024" });
    socket.handlers?.onError?.("upstream failed", true);
    const error = await job.catch((err: unknown) => err);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(StreamUnavailableError);
  });

  it("counts non-fatal errors for the current job and resets them on the next start", async () => {
    const socket = socketWithStart({ ok: true, jobId: "j" });
    const first = socket.runJob("class-spells", { className: "Wizard", rulesVersion: "2024" });
    socket.handlers?.onError?.("skipped one", false);
    socket.handlers?.onError?.("skipped another", false);
    socket.handlers?.onDone?.({});
    await first;
    expect(socket.nonFatalErrors).toBe(2);

    const second = socket.runJob("class-spells", { className: "Cleric", rulesVersion: "2024" });
    socket.handlers?.onDone?.({});
    await second;
    expect(socket.nonFatalErrors).toBe(0);
  });
});
