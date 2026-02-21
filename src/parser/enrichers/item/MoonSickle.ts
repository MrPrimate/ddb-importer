import DDBEnricherData from "../data/DDBEnricherData";

export default class MoonSickle extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1d4", 20, "system.bonuses.heal.damage"),
        ],
      },
    ];
  }

}
