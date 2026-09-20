import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Strike Fear (Scion of the Three, 2024): a Cunning Strike option costing one Sneak Attack die.
 * DDB ships the Terrify save with its Frightened status; this adds the reduced Sneak Attack
 * damage roll that goes with it, following the Cunning Strike pattern.
 */
export default class StrikeFear extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Cunning Sneak Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you deal Sneak Attack damage and forgo one die for Strike Fear",
          },
          rangeOverride: {
            units: "spec",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
              choice: false,
              special: "",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scale.rogue.sneak-attack.number - 1)d6",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    ];
  }

}
