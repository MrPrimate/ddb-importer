import DDBEnricherData from "../data/DDBEnricherData";

export default class BloodBolt extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Temporary Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          noSpellslot: true,
          generateAttack: false,
          generateConsumption: false,
          generateDamage: false,
          generateHealing: true,
          generateDuration: true,
          generateRange: true,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "On a hit",
          },
          rangeOverride: {
            value: "",
            units: "self",
            special: "",
          },
          targetOverride: {
            prompt: false,
            affects: {
              count: "1",
              type: "self",
            },
            template: {},
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          // a cantrip would otherwise scale the part with the damage dice
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "temphp", scalingMode: "none" }),
        },
        overrides: {
          noConsumeTargets: true,
          noSpellslot: true,
        },
      },
    ];
  }

}
