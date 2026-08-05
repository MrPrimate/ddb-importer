import DDBEnricherData from "../../data/DDBEnricherData";

export default class EnvenomedWeapons extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Envenomed Weapon",
      targetType: "creature",
      activationType: "action",
      activationCondition: "Coat a weapon or up to 5 pieces of ammunition; venom lasts 1 minute",
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "",
            formula: "10 + @prof",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              // 2d4, 3d4 from level 5
              customFormula: "(@details.level >= 5 ? 3 : 2)d4",
              types: ["poison"],
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
