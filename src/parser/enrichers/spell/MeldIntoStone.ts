import DDBEnricherData from "../data/DDBEnricherData";

export default class MeldIntoStone extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }


  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Minor Physical Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateDuration: true,
          generateActivation: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 6,
              denomination: 6,
              types: ["force"],
            }),
          ],
          noeffect: true,
          activationOverride: {
            type: "special",
            condition: "",
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
      {
        init: {
          name: "Destruction",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateDuration: true,
          generateActivation: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "50",
              types: ["force"],
            }),
          ],
          noeffect: true,
          activationOverride: {
            type: "special",
            condition: "",
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
      },
    ];
  }

}
