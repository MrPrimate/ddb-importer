import DDBEnricherData from "../../data/DDBEnricherData";

export default class AspectOfTheBeastBear extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.encumbrance.multipliers.overall"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
        ],
      },
    ];
  }

}
