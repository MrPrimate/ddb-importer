import DDBEnricherData from "../../data/DDBEnricherData";

export default class RadiantStrikes extends DDBEnricherData {

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  get effects() {
    return [{
      options: {
        transfer: true,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1d8[radiant]", 20, "system.bonuses.mwak.damage"),
      ],
    }];
  }

}
