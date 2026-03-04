import DDBEnricherData from "../../data/DDBEnricherData";

export default class CreateThrall extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      name: "Hex damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "1/turn. Thrall hits creature under your hex",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.cha.mod",
          types: ["psychic"],
        }),
      ],
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Thrall Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@abilities.cha.mod + @classes.warlock.levels",
            types: ["temphp"],
          }),
        },
      },
    ];
  }

}
