import Generic from "./Generic";
import DDBEnricherData from "../data/DDBEnricherData";

export default class AbberantDragonmark extends Generic {
  get additionalActivities(): IDDBAdditionalActivity[] {
    const hd = this.ddbParser.isMunche
      ? [4, 6, 8, 10, 12]
      : this.ddbParser.ddbCharacter.source.ddb.character.classes
        .map((klass) => klass.definition.hitDice);
    const activities = hd.map((die) => {
      return {
        init: {
          name: `Aberrant Surge: Spend HD (d${die})`,
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateDamage: false,
          generateHealing: true,
          generateRange: true,
          generateConsumption: true,
          healingPart: Generic.basicDamagePart({
            number: 1,
            denomination: die,
            type: "temphp",
          }),
          consumptionOverride: {
            spellSlot: false,
            scaling: {
              allowed: false,
            },
            targets: [
              {
                type: "hitDice",
                target: `d${die}`,
                value: 1,
                scaling: {
                  mode: "amount",
                  formula: "1",
                },
              },
            ],
          },
        },
      };
    });

    return activities;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }
}
