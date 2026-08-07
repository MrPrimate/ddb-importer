import DDBEnricherData from "../data/DDBEnricherData";

export default class StellarBodies extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Star Attack",
      splitDamage: true,
      noeffect: true,
      targetType: "creature",
      data: {
        range: {
          override: true,
          units: "ft",
          value: "120",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Blinding Flash",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: false,
          generateConsumption: false,
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          activationOverride: { type: "special", condition: "Hit by a Star Attack" },
        },
        overrides: {
          targetType: "creature",
          overrideTarget: true,
        },
      },
      {
        init: {
          name: "Orbiting Star Retaliation",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          noeffect: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["radiant"],
            }),
          ],
          activationOverride: { type: "special", condition: "A creature within 5 feet hits you with a melee attack (1d8 per orbiting star)" },
        },
        overrides: {
          targetType: "creature",
          overrideTarget: true,
        },
      },
    ];
  }

  get clearAutoEffects(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stellar Bodies: Blinded",
        statuses: ["Blinded"],
        activityMatch: "Blinding Flash",
        options: {
          durationRounds: 1,
        },
      },
    ];
  }

}
