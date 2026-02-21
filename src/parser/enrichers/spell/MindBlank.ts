import DDBEnricherData from "../data/DDBEnricherData";

export default class MindBlank extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("psychic", 20, "system.traits.di.value"),
        ],
      },
    ];
  }

}
