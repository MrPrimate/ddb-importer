import DDBEnricherData from "../../data/DDBEnricherData";

export default class Indomitable extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      addItemConsume: true,
    };
  }

  get effects(): IDDBEffectHint[] {
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

  get override(): IDDBOverrideData {
    const uses = this._getGeneratedUses({
      type: "class",
      name: "Indomitable",
    });
    uses.max = "@scale.fighter.indomitable";
    return {
      uses,
    };
  }

}
