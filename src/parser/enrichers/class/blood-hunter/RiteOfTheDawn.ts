import DDBEnricherData from "../../data/DDBEnricherData";
import _CrimsonRite from "./_CrimsonRite";

/**
 * Order of the Ghostslayer, 3rd level. Radiant rite that also sheds bright
 * light and grants necrotic resistance while active, so the enchantment
 * carries a rider effect for the actor-side benefits.
 *
 * The extra hemocraft die against undead cannot be tested declaratively and
 * stays in the description.
 */
export default class RiteOfTheDawn extends _CrimsonRite {

  static RIDER_ID = "ddbRiteOfDawnBls";

  override get riteName(): string {
    return "Rite of the Dawn";
  }

  /** Ghostslayer grants its own scale for this rite. */
  override get riteDie(): string {
    return "@scale.order-of-the-ghostslayer.rite-of-the-dawn";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return this.invokeRiteActivity;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [this.applyRiteActivity(this.riteName)];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      this.riteEnchantEffect(this.riteName, {
        effectRiders: [RiteOfTheDawn.RIDER_ID],
      }),
      {
        // rider applied alongside the enchantment; must not link to a real
        // activity of its own
        name: "Rite of the Dawn: Blessing",
        activitiesMatch: ["Not real"],
        options: {
          transfer: true,
        },
        data: {
          _id: RiteOfTheDawn.RIDER_ID,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
        ],
        tokenChanges: [
          DDBEnricherData.ChangeHelper.tokenChange("token.light.bright", "upgrade", 20, 20),
          DDBEnricherData.ChangeHelper.tokenChange("token.light.dim", "upgrade", 40, 20),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: "<p><em>When you hit an undead creature with a weapon for which the Rite of the Dawn is active, you roll an additional hemocraft die when determining the extra damage from the rite. Add this manually.</em></p>",
    };
  }

}
