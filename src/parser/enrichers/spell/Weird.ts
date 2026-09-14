import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Weird: the initial save deals the big psychic hit and frightens; the end-of-turn save deals the smaller hit on a failure or ends the spell for that creature. DDB folds both rolls into one activity.
 */
export default class Weird extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: this.is2014 ? 4 : 10,
          denomination: 10,
          types: ["psychic"],
        }),
      ],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "End of Turn Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the end of each of the frightened creature's turns",
          },
          saveOverride: {
            ability: ["wis"],
            dc: { calculation: "spellcasting", formula: "" },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 4 : 5,
              denomination: 10,
              types: ["psychic"],
            }),
          ],
          rangeOverride: { units: "any" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          data: {
            damage: { onSave: "none" },
          },
        },
      },
    ];
  }

}
