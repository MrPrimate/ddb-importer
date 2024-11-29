/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TongueOfTheSunAndMoon extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("standard:*", 20, "system.traits.languages.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("exotic:*", 20, "system.traits.languages.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("ddb:*", 10, "system.traits.languages.value"),
        ],
      },
    ];
  }

}
