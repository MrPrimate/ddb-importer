import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfBloodshed extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Killer's Fortune",
      activationType: "special",
      activationCondition: "An enemy you can see is reduced to 0 Hit Points",
      targetType: "self",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Power from Pain", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateActivation: true,
          activationOverride: { type: "special", value: null, condition: "Once per turn, when you make an attack roll while Bloodied" },
          generateConsumption: false,
          generateDamage: true,
          // the extra damage takes the attack's own type
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: DDBEnricherData.allDamageTypes() })],
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Killer's Fortune",
        activityMatch: "Killer's Fortune",
        daeSpecialDurations: ["1Attack"],
        options: { expiry: "sourceEnd" },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
