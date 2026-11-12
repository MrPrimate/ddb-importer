import DDBEnricherData from "../data/DDBEnricherData";

const DICE = ["1d4", "1d6", "1d8", "1d10", "1d12"];

/**
 * World of Warcraft (Warlock): the target saves each turn and takes the spell's damage either way;
 * a failure steps the die up (d4, d6, d8, d10, d12 at most) and a success ends the curse. DDB lists
 * every die as a part of one save, which rolled them all together. The cast rolls the d4; each
 * later save is its own slot-free activity for the current die.
 */
export default class CurseOfAgony extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast (1d4)",
      data: {
        damage: {
          onSave: "full",
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "1d4", types: ["psychic"], scalingMode: "none" })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return DICE.map((die) => ({
      init: {
        name: `End of Turn Save (${die})`,
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateActivation: true,
        generateDamage: true,
        generateSave: true,
        generateConsumption: false,
        generateTarget: true,
        generateDuration: true,
        noSpellslot: true,
        onSave: "full",
        activationOverride: { type: "special", value: null, condition: "At the end of each of the cursed target's turns, at the current die" },
        durationOverride: { units: "inst", concentration: false },
        targetOverride: { override: true, affects: { count: "1", type: "creature" } },
        saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
        damageParts: [DDBEnricherData.basicDamagePart({ customFormula: die, types: ["psychic"], scalingMode: "none" })],
      },
    }));
  }

}
