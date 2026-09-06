import { getCondition, getActorConditionStates } from "../../../src/parser/character/conditions";
import { DICTIONARY } from "../../../src/config/_module";

// minimal Foundry-ish actor: DDBEffectHelper.getConditionEffectAppliedAndActive
// only walks actor.allApplicableEffects() looking at { name, disabled }
function fakeActor(effects: { name: string; disabled?: boolean }[] = []): any {
  return {
    allApplicableEffects: () => effects.map((e) => ({ disabled: false, ...e })),
  };
}

function fakeDdb(conditions: { id: number; level: number | null }[] = []): any {
  return { character: { conditions } };
}

function state(states: any[], label: string) {
  const found = states.find((s) => s.label === label);
  expect(found).toBeDefined();
  return found;
}

describe("getCondition", () => {
  it("finds a condition mapping by its DDB label", () => {
    const condition = getCondition("Prone");
    expect(condition?.foundry).toBe("prone");
    expect(condition?.ddbId).toBe(12);
  });

  it("returns undefined for an unknown label", () => {
    expect(getCondition("Mildly Perturbed")).toBeUndefined();
  });
});

describe("getActorConditionStates", () => {
  it("covers every mapped DDB condition and no unmapped ones", () => {
    const states = getActorConditionStates(fakeActor(), fakeDdb());
    // all DICTIONARY.conditions with an integer ddbId: the base Exhaustion and
    // Diseased rows (ddbId null) are filtered out, leaving 21 rows including
    // the six exhaustion levels
    expect(states).toHaveLength(21);
    expect(states.every((s) => Number.isInteger(s.ddbId))).toBe(true);
    expect(states.every((s) => !s.needsAdd && !s.needsRemove && !s.needsUpdate)).toBe(true);
  });

  it("flags a DDB condition missing on the actor as needing an add", () => {
    const states = getActorConditionStates(fakeActor(), fakeDdb([{ id: 12, level: null }]));
    const prone = state(states, "Prone");
    expect(prone.ddbCondition).toBe(true);
    expect(prone.applied).toBe(false);
    expect(prone.needsAdd).toBe(true);
    expect(prone.needsRemove).toBe(false);
    expect(prone.needsUpdate).toBe(true);
  });

  it("flags an actor effect missing in DDB as needing a remove", () => {
    const states = getActorConditionStates(fakeActor([{ name: "Poisoned" }]), fakeDdb());
    const poisoned = state(states, "Poisoned");
    expect(poisoned.ddbCondition).toBe(false);
    expect(poisoned.applied).toBe(true);
    expect(poisoned.conditionApplied).toEqual({ name: "Poisoned", disabled: false });
    expect(poisoned.needsAdd).toBe(false);
    expect(poisoned.needsRemove).toBe(true);
    expect(poisoned.needsUpdate).toBe(true);
  });

  it("keeps a local-only effect when keepLocal is set", () => {
    const states = getActorConditionStates(fakeActor([{ name: "Poisoned" }]), fakeDdb(), true);
    const poisoned = state(states, "Poisoned");
    expect(poisoned.applied).toBe(true);
    expect(poisoned.needsRemove).toBe(false);
    expect(poisoned.needsUpdate).toBe(false);
  });

  it("treats a condition present on both sides as in sync, matching case-insensitively", () => {
    const states = getActorConditionStates(fakeActor([{ name: "prone" }]), fakeDdb([{ id: 12, level: null }]));
    const prone = state(states, "Prone");
    expect(prone.ddbCondition).toBe(true);
    expect(prone.applied).toBe(true);
    expect(prone.needsAdd).toBe(false);
    expect(prone.needsRemove).toBe(false);
    expect(prone.needsUpdate).toBe(false);
  });

  it("ignores disabled actor effects", () => {
    const states = getActorConditionStates(fakeActor([{ name: "Stunned", disabled: true }]), fakeDdb());
    const stunned = state(states, "Stunned");
    expect(stunned.applied).toBe(false);
    // needsRemove short-circuits to the undefined conditionApplied rather than
    // a boolean when nothing is applied - falsy either way
    expect(stunned.needsRemove).toBeFalsy();
  });

  it("matches an exhaustion level to exactly one exhaustion row", () => {
    const states = getActorConditionStates(fakeActor(), fakeDdb([{ id: 4, level: 3 }]));
    expect(state(states, "Exhaustion 3").needsAdd).toBe(true);
    expect(state(states, "Exhaustion 2").needsAdd).toBe(false);
    expect(state(states, "Exhaustion 4").needsAdd).toBe(false);
    expect(states.filter((s) => s.needsAdd)).toHaveLength(1);
  });

  it("returns fresh state objects without mutating DICTIONARY.conditions", () => {
    // mergeObject defaults to inplace and the mapped elements are the shared
    // dictionary rows, so this once stamped per-actor sync flags onto the
    // global dictionary; conditions.ts now merges with inplace: false
    const states = getActorConditionStates(fakeActor(), fakeDdb([{ id: 12, level: null }]));
    const dictionaryProne: any = DICTIONARY.conditions.find((c) => c.label === "Prone");
    expect(state(states, "Prone")).not.toBe(dictionaryProne);
    expect(state(states, "Prone").needsAdd).toBe(true);
    expect(dictionaryProne.needsAdd).toBeUndefined();
    expect(dictionaryProne.ddbCondition).toBeUndefined();
    // a later call for a different actor must not disturb earlier results
    const held = state(states, "Prone");
    getActorConditionStates(fakeActor(), fakeDdb());
    expect(held.needsAdd).toBe(true);
    expect(dictionaryProne.needsAdd).toBeUndefined();
  });
});

// setConditions is not covered here: it creates/deletes embedded ActiveEffect
// documents and needs a real (or heavily stubbed) Foundry document layer
