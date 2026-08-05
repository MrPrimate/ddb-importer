import DDBEnricherData from "../../data/DDBEnricherData";

export default class NimbusOfPathos extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      activationCondition: "Touch a willing creature",
      rangeType: "touch",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Nimbus of Pathos",
        options: {
          durationSeconds: 60,
          description: "+4 AC, advantage on attack rolls and saving throws, +1d10 radiant on weapon and spell attack hits, critical hits on 18-20. When the effect ends the creature drops to 0 hit points and is dying.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("4", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d10[radiant]", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d10[radiant]", 20, "system.bonuses.rwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d10[radiant]", 20, "system.bonuses.msak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d10[radiant]", 20, "system.bonuses.rsak.damage"),
          DDBEnricherData.ChangeHelper.overrideChange("18", 20, "flags.dnd5e.weaponCriticalThreshold"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.save.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.automated-conditions-5e.attack.advantage"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
      },
    ];
  }

}
