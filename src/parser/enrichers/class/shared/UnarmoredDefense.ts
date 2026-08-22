import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnarmoredDefense extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const changes = [];
    if (this.isClass("Barbarian")) {
      changes.push(
        DDBEnricherData.ChangeHelper.acCalcsAddChange("unarmoredBarb", 15),
      );
    } else if (this.isClass("Monk")) {
      changes.push(
        DDBEnricherData.ChangeHelper.acCalcsAddChange("unarmoredMonk", 15),
      );
    }
    return [
      {
        noCreate: true,
        changesOverwrite: true,
        changes,
        data: {
          flags: {
            dae: {
              // disableCondition: "attributes?.ac?.equippedArmor",
            },
          },
        },
      },
    ];
  }

}
