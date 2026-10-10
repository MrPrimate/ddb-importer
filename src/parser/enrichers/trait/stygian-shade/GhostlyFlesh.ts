import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Activating is a self-enchantment whose rider is the ghostly form's effect. While it is applied
 * the activity becomes the bonus action that ends it, so there is no separate deactivate activity.
 */
export default class GhostlyFlesh extends DDBEnricherData {

  static EFFECT_ID = "ddbGhostlyFleshE";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      // the default parse turns the incidental "1d10 force if you end your
      // turn inside an object" into the main damage roll; replace with the
      // transformation
      name: "Ghostly Flesh (Activate)",
      targetType: "self",
      noTemplate: true,
      activationType: "action",
      data: {
        duration: { value: "1", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ghostly Flesh",
        options: {
          transfer: true,
          durationSeconds: 60,
          description: "Flying speed 30 ft (hover); resistance to nonmagical, non-silvered bludgeoning, piercing and slashing damage; advantage on checks and saves against grapples and being restrained; move through creatures and objects as difficult terrain (1d10 Force damage if you end your turn inside an object).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.movement.hover"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.traits.dr.bypasses"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("sil", 20, "system.traits.dr.bypasses"),
        ],
        data: {
          _id: GhostlyFlesh.EFFECT_ID,
        },
      },
      {
        name: "Ghostly Flesh",
        type: "enchant",
        activityMatch: "Ghostly Flesh (Activate)",
        changes: [
          ...toggleOffChanges("Ghostly Flesh (Deactivate)"),
          DDBEnricherData.ChangeHelper.overrideChange("bonus", 90, "activities[enchant].activation.type"),
        ],
        data: {
          flags: {
            ddbimporter: riders({ effects: [GhostlyFlesh.EFFECT_ID] }),
          },
        },
      },
    ];
  }

}
