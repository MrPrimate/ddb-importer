import DDBEnricherData from "../../data/DDBEnricherData";

export default class QuickDraw extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Quick Draw",
        options: {
          transfer: true,
        },
        changes: [
          // advantage on initiative rolls
          DDBEnricherData.ChangeHelper.advantageInitiativeChange(),
        ],
      },
    ];
  }

}
