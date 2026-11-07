import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Earthen (World of Warcraft): replace an attack with a 15 ft Cone of Azerite energy, Proficiency
 * Bonus uses per Long Rest. Chosen creatures regain the dice as Hit Points; the others make a Dex save
 * (DC 8 + Con mod + PB) against the same dice of Radiant damage, half on a success. The dice grow
 * from 1d10 to 4d10 at character levels 5, 11 and 17.
 */
export default class AzeriteSurge extends DDBEnricherData {

  static DICE = "(1 + (@details.level >= 5) + (@details.level >= 11) + (@details.level >= 17))d10";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Azerite Surge: Damage",
      activationType: "special",
      activationCondition: "Replace one attack of the Attack action",
      addItemConsume: true,
      targetType: "creature",
      data: {
        target: {
          template: { contiguous: false, type: "cone", size: "15", units: "ft" },
          affects: { type: "enemy", choice: true },
        },
        save: {
          ability: ["dex"],
          dc: { calculation: "con", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ customFormula: AzeriteSurge.DICE, types: ["radiant"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Azerite Surge: Healing", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "The same use of Azerite Surge" },
          targetOverride: {
            override: true,
            affects: { type: "ally", choice: true },
            template: { contiguous: false, type: "cone", size: "15", units: "ft" },
          },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: AzeriteSurge.DICE, types: ["healing"] }),
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "@prof",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
