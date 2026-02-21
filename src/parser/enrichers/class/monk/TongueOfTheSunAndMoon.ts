import DDBEnricherData from "../../data/DDBEnricherData";

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
