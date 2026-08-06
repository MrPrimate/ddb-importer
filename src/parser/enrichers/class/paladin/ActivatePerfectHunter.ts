import DDBEnricherData from "../../data/DDBEnricherData";

export default class ActivatePerfectHunter extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        range: {
          units: "self",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Perfect Hunter",
      statuses: ["invisible"],
      options: {
        durationSeconds: 600,
        description: "Devour: weapon attacks deal an extra 1d8 Necrotic damage that ignores Necrotic Resistance and Immunity. Sunder: Immunity to the Grappled, Paralyzed, and Restrained conditions. Vanish: you have the Invisible condition.",
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1d8[necrotic]", 20, "system.bonuses.mwak.damage"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("1d8[necrotic]", 20, "system.bonuses.rwak.damage"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("grappled", 20, "system.traits.ci.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("paralyzed", 20, "system.traits.ci.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("restrained", 20, "system.traits.ci.value"),
      ],
    }];
  }

  get clearAutoEffects() {
    return true;
  }

}
