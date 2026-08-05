import DDBEnricherData from "../../data/DDBEnricherData";

export default class GhostlyFlesh extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      // the default parse turns the incidental "1d10 force if you end your
      // turn inside an object" into the main damage roll; replace with the
      // transformation utility
      name: "Ghostly Flesh (Activate)",
      targetType: "self",
      activationType: "action",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ghostly Flesh (Deactivate)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          activationOverride: { type: "bonus", condition: "" },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ghostly Flesh",
        options: {
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
      },
    ];
  }

}
