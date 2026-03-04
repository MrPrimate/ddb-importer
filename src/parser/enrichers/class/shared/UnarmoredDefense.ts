import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnarmoredDefense extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    const changes = [];
    if (this.isClass("Barbarian")) {
      changes.push(
        DDBEnricherData.ChangeHelper.overrideChange("unarmoredBarb", 15, "system.attributes.ac.calc"),
      );
    } else if (this.isClass("Monk")) {
      changes.push(
        DDBEnricherData.ChangeHelper.overrideChange("unarmoredMonk", 15, "system.attributes.ac.calc"),
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
