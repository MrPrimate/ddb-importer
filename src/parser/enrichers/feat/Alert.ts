import DDBEnricherData from "../data/DDBEnricherData";

export default class Alert extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    const changes = this.is2014
      ? [DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.initiativeAlert")]
      : [DDBEnricherData.ChangeHelper.unsignedAddChange("@prof", 20, "system.attributes.init.bonus")];
    return [
      {
        options: {
          transfer: true,
        },
        changes,
      },
    ];

  }

}
