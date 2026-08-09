import DDBEnricherData from "../../data/DDBEnricherData";

export default class RemarkableAthlete extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: !this.is2014,
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.remarkableAthlete"),
        ],
      },
    ];
  }

}
