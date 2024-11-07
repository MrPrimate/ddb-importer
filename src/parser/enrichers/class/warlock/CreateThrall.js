/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class CreateThrall extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Hex damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "1/turn. Thrall hits creature under your hex",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          customFormula: "@abilities.cha.mod",
          types: ["psychic"],
        }),
      ],
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Thrall Temp HP",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
          headlingPart: DDBEnricherMixin.basicDamagePart({
            customFormula: "@abilities.cha.mod + @classes.warlock.levels",
            types: ["temphp"],
          }),
        },
      },
    ];
  }

}
