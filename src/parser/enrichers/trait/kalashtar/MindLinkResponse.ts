import DDBEnricherData from "../../data/DDBEnricherData";

export default class MindLinkResponse extends DDBEnricherData {

  get activity() {
    return {
      data: {
        range: {
          units: "spec",
          special: "Within sight",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("Telepathy", 10, "system.traits.languages.custom"),
        ],
        data: {
          duration: {
            seconds: 3600,
          },
        },
      },
    ];
  }

}
