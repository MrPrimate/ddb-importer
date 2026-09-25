import ExtinguishUndead from "./ExtinguishUndead";

/**
 * Death's Master (Necromancer, AU 2024): the "Extinguish Undead: Spell Slot" DDB action, used
 * on an Undead the wizard does not control. Same save and damage as ExtinguishUndead but it
 * costs a Reaction and a level 5+ spell slot. It emits no effect of its own: once merged into
 * Death's Master the activity links to the sibling ExtinguishUndead "No Reactions" effect.
 */
export default class ExtinguishUndeadSpellSlot extends ExtinguishUndead {

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      name: "Extinguish Uncontrolled Undead",
      activationType: "reaction",
      activationCondition: "An Undead you don't control drops to 0 HP; roll d6s equal to half its unexpended Hit Dice",
      addConsumptionScalingMax: "9",
      additionalConsumptionTargets: [
        { type: "spellSlots", value: "1", target: "5", scaling: { mode: "level", formula: "" } },
      ],
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [];
  }

}
