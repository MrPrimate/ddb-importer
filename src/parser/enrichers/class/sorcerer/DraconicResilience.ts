import DDBEnricherData from "../../data/DDBEnricherData";

export default class DraconicResilience extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const acType = this.is2014 ? "draconic" : "unarmoredBard";
    return [
      {
        noCreate: true,
        changesOverwrite: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1 * @classes.sorcerer.levels", 20, "system.attributes.hp.bonuses.overall"),
          DDBEnricherData.ChangeHelper.acCalcsAddChange(acType, 20),
        ],
      },
    ];
  }

}
