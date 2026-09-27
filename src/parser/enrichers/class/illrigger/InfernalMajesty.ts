import DDBEnricherData from "../../data/DDBEnricherData";
import TerrorizingForce from "./TerrorizingForce";

/**
 * Infernal Majesty doubles the Terrorizing Force die, so its effect adds a second 1d8 of the type
 * chosen on DDB. That type is fixed at import; switching Terrorizing Force after a long rest does
 * not follow into this effect.
 */
export default class InfernalMajesty extends DDBEnricherData {

  /** The Terrorizing Force damage type chosen on DDB, which Infernal Majesty doubles. */
  get terrorizingForceType(): string | null {
    return TerrorizingForce.chosenType(this.ddbParser.ddbData);
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Channel Infernal Majesty",
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: {
        duration: {
          units: "minute",
          value: "10",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const damageType = this.terrorizingForceType;
    // the Terrorizing Force die becomes 2d8, i.e. one more 1d8 of the same type
    const terrorizingForceChanges = damageType
      ? [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`1d8[${damageType}]`, 20, "system.bonuses.mwak.damage"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`1d8[${damageType}]`, 20, "system.bonuses.rwak.damage"),
      ]
      : [];
    return [
      {
        name: "Infernal Majesty",
        activityMatch: "Channel Infernal Majesty",
        options: {
          durationSeconds: 600,
          description: "When you use Blood Price, an enemy you can see within 10 feet of you takes damage equal to the number rolled on your Hit Die. If you die, you can have your body reform in Hell 1d6 days later.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("fire"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.fly"),
          ...terrorizingForceChanges,
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const damageType = this.terrorizingForceType;
    return {
      descriptionSuffix: damageType
        ? `
<section class="secret ddbSecret" id="secret-ddbInfernalMajesty">
<p><strong>Implementation Details</strong></p>
<p>The extra Terrorizing Force die is ${damageType} damage, the type chosen when this character was imported. If you switch Terrorizing Force to another type, edit the Infernal Majesty effect or re-import.</p>
</section>`
        : undefined,
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Infernal Majesty",
        max: "1",
        period: "lr",
      }),
    };
  }

}
