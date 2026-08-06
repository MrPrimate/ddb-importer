import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritAura extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Spirit Aura",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        range: {
          units: "self",
        },
        target: {
          template: {
            type: "radius",
            size: "10",
            units: "ft",
            count: "",
            contiguous: false,
            width: "",
            height: "",
          },
        },
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Sorcery Points to Restore Use",
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
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "3",
                target: "sorcery-points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Maddening Whispers",
        activityMatch: "Spirit Aura",
        options: {
          durationRounds: 1,
          description: "An enemy that enters the aura or starts its turn there and fails the save has Disadvantage on ability checks and attack rolls until the end of its next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.check.all"),
        ],
      },
      {
        name: "Bolstering Whispers",
        activityMatch: "Spirit Aura",
        options: {
          durationRounds: 1,
          description: "An ally that enters the aura or starts its turn there has Advantage on ability checks and attack rolls until the end of its next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.check.all"),
        ],
      },
    ];
  }

}
