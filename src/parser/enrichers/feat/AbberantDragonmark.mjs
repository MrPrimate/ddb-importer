/* eslint-disable class-methods-use-this */
import Generic from "./Generic.mjs";

export default class AberrantDragonmark extends Generic {
  get additionalActivities() {
    const hd = this.ddbParser.isMunche
      ? [4, 6, 8, 10, 12]
      : this.ddbParser.ddbCharacter.source.ddb.character.classes
        .map((klass) => klass.definition.hitDice);
    const activities = hd.map((die) => {
      return {
        constructor: {
          name: `Aberrant Surge: Spend HD (d${die})`,
          type: "heal",
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
