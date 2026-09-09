import DDBEnricherData from "../../data/DDBEnricherData";

export default class VedalkenDispassion extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: false,
        },
        changes: ["int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability),
        ),
      },
    ];
  }

}
