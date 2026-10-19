import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A failed save applies one band of conditions picked by the target's current hit points. DDB's
 * condition list carries the bands as separate per-condition rows with their durations, so the
 * effects are rebuilt as one effect per band for the GM to apply.
 */
export default class DivineWord extends DDBEnricherData {

  // one band applies, chosen by the target's hit points: Midi prompts rather than applying all four
  override get activity(): IDDBActivityData {
    return {
      data: { midiProperties: { chooseEffects: true } },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Divine Word: 41-50 HP (Deafened)",
        statuses: ["Deafened"],
        options: { durationSeconds: 60 },
      },
      {
        name: "Divine Word: 31-40 HP (Blinded and Deafened)",
        statuses: ["Blinded", "Deafened"],
        options: { durationSeconds: 600 },
      },
      {
        name: "Divine Word: 21-30 HP (Blinded, Deafened and Stunned)",
        statuses: ["Blinded", "Deafened", "Stunned"],
        options: { durationSeconds: 3600 },
      },
      {
        name: "Divine Word: 20 HP or Fewer (Dead)",
        statuses: ["Dead"],
        options: { durationSeconds: null },
      },
    ];
  }

}
