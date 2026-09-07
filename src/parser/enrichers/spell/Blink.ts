import DDBEnricherData from "../data/DDBEnricherData";

export default class Blink extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ethereal",
        statuses: ["Ethereal"],
        options: { expiry: "sourceStart" },
        data: {
          disabled: true,
        },
      },
    ];
  }

}
