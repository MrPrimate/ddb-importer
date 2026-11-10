import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Forsaken (World of Warcraft): once per Long Rest, when dealing damage, add Proficiency Bonus d4s of
 * Necrotic and regain as many Hit Points. dnd5e cannot pass a damage total to a heal, and a second
 * roll would disagree with the damage and ignore the target's resistance or immunity, so the heal
 * rolls 0 and the damage actually dealt is entered as its situational bonus.
 */
export default class TouchOfTheGrave extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bonus Damage",
      activationType: "special",
      activationCondition: "You deal damage to a creature",
      addItemConsume: true,
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "(@prof)d4", types: ["necrotic"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Regain Hit Points", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "Equal to the extra Necrotic damage dealt (enter it as the situational bonus)",
          },
          targetOverride: { override: true, affects: { type: "self" } },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "0", types: ["healing"] }),
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
