import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefileGround extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Place Template",
      targetType: "enemy",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Defile Ground: Move Corruption",
          type: "class",
        },
      },
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.blighted.defile-ground.die",
              types: ["necrotic"],
            }),
          ],
        },
        overrides: {
          noTemplate: true,
          targetType: "creature",
          activationType: "special",
        },
      },
    ];
  }

}
