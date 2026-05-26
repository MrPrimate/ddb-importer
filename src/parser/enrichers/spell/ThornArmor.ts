import DDBEnricherData from "../data/DDBEnricherData";

export default class ThornArmor extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
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
