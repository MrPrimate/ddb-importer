import DDBEnricherData from "../../data/DDBEnricherData";

export default class Indomitable extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reroll",
      noTemplate: true,
      addItemConsume: true,
      activationType: "special",
      activationCondition: "When you fail a saving throw",
      targetType: "self",
      // the 2024 reroll adds the Fighter level
      data: this.is2014
        ? {}
        : {
          roll: {
            prompt: false,
            visible: false,
            formula: `@classes.${this.classIdentifier("Fighter")}.levels`,
            name: "Bonus",
          },
        },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [
          {
            name: "Indomitable",
            data: {
              label: "Use Indomitable to Succeed?",
              count: "ItemUses.Indomitable",
              "save.fail": "reroll",
            },
          },
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getGeneratedUses({
      type: "class",
      name: "Indomitable",
    });
    uses.max = `@scale.${this.classIdentifier("Fighter")}.indomitable`;
    return {
      uses,
    };
  }

}
