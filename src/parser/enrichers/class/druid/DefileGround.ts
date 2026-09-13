import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefileGround extends DDBEnricherData {

  /** Both placement activities follow the level-10 radius increase. */
  get _target(): I5eActivityTarget {
    return { template: { size: "10 + 10 * min(1, floor(@classes.druid.levels / 10))" } };
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Template",
      targetType: "enemy",
      data: {
        target: this._target,
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
        overrides: { data: { target: this._target } },
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
