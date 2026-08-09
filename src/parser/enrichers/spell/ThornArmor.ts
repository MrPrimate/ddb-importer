import DDBEnricherData from "../data/DDBEnricherData";

export default class ThornArmor extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Thorn Armor",
        options: {
          durationSeconds: 600,
        },
      },
    ];
  }

}
