import DDBEnricherData from "../../data/DDBEnricherData";

export default class QuickDraw extends DDBEnricherData {

  get clearAutoEffects(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Quick Draw",
        options: {
          transfer: true,
        },
        changes: [
          // advantage on initiative rolls
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.init.roll.mode"),
        ],
      },
    ];
  }

}
