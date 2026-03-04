import DDBEnricherData from "../../data/DDBEnricherData";

export default class Launch extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Leap",
      activationType: "bonus",
      targetSelf: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBEnricherData.basicDamagePart({
            customFormula: "1@scale.steel-hawk.launch.die",
            types: DDBEnricherData.allDamageTypes(),
          })],
        },
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Launch",
      type: "class",
      max: "@scale.steel-hawk.launch.number",
    });
    return {
      uses,
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
