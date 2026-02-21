import DDBEnricherData from "../data/DDBEnricherData";

export default class DivineFavor extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 0, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 0, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
