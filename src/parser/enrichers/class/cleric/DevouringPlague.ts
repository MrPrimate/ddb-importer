import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shadow Domain (World of Warcraft) and the WoW Priest's Shadow Specialization: when a creature
 * within 30 feet fails a save, it takes 1d10 Necrotic and the priest regains as many Hit Points
 * (the heal activity, whose amount is entered as the situational bonus since dnd5e cannot pass
 * the damage total, and a separate roll would ignore critical hits and resistance). Wis mod uses
 * (minimum one), regained on a Long Rest.
 */
export default class DevouringPlague extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Devouring Plague",
      activationType: "special",
      activationCondition: "A creature you can see within 30 feet fails a saving throw",
      addItemConsume: true,
      targetType: "creature",
      data: {
        range: { units: "ft", value: "30" },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, types: ["necrotic"] }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Regain Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "Equal to the Necrotic damage dealt (enter it as the situational bonus)",
          },
          targetOverride: {
            override: true,
            affects: { type: "self" },
          },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "0", types: ["healing"] }),
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "max(1, @abilities.wis.mod)",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
