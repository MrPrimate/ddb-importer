import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The storm's later rounds happen on the caster's later turns while concentration holds, so each
 * round is its own slot-free activity rather than another damage part on the casting save.
 */
export default class StormOfVengeance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Create Storm",
      removeDamageParts: true,
      damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, type: "thunder" })],
      data: {
        damage: { onSave: "none" },
      },
    };
  }

  #roundActivity({ name, condition, part, save }: {
    name: string;
    condition: string;
    part: I5eDamagePart;
    save?: string;
  }): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: save ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateDuration: true,
        durationOverride: { units: "inst", concentration: false },
        generateConsumption: false,
        noSpellslot: true,
        generateDamage: true,
        damageParts: [part],
        generateSave: Boolean(save),
        ...(save ? { saveOverride: { ability: [save], dc: { calculation: "spellcasting", formula: "" } }, onSave: "half" } : {}),
        generateActivation: true,
        activationOverride: { type: "special", value: null, condition },
        noeffect: true,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const turn = this.is2014 ? "Round" : "Turn";
    return [
      this.#roundActivity({
        name: `${turn} 2: Acid Rain`,
        condition: `${turn} 2 of the storm`,
        // the 2014 printing rains 1d6 acid, the 2024 one 4d6
        part: DDBEnricherData.basicDamagePart({ number: this.is2014 ? 1 : 4, denomination: 6, type: "acid" }),
      }),
      this.#roundActivity({
        name: `${turn} 3: Lightning`,
        condition: `${turn} 3 of the storm: six bolts at six different targets`,
        part: DDBEnricherData.basicDamagePart({ number: 10, denomination: 6, type: "lightning" }),
        save: "dex",
      }),
      this.#roundActivity({
        name: `${turn} 4: Hailstones`,
        condition: `${turn} 4 of the storm`,
        part: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, type: "bludgeoning" }),
      }),
      this.#roundActivity({
        name: `${turn}s 5-10: Gusts and Freezing Rain`,
        condition: `${turn}s 5 to 10 of the storm`,
        part: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "cold" }),
      }),
    ];
  }

  // 2014 deafens for 5 minutes, outlasting the spell; 2024 deafens for the spell's duration
  override get effects(): IDDBEffectHint[] {
    if (!this.is2014) return [];
    return [
      {
        noCreate: true,
        // rounds too: the spell's own 10 rounds would otherwise end it after a minute
        data: { duration: { seconds: 300, rounds: 50 } },
      },
    ];
  }

}
