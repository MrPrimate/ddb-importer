import DDBEnricherData from "../data/DDBEnricherData";

export default class BladeWard extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [
        {
          changes: [
            DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning", 10),
            DDBEnricherData.ChangeHelper.damageResistanceChange("slashing", 10),
            DDBEnricherData.ChangeHelper.damageResistanceChange("piercing", 10),
          ],
          daeSpecialDurations: ["turnEnd"],
        },
      ];
    } else {
      return [
        {
          // 2024: attackers subtract 1d4 from attack rolls against the warded
          // creature for the duration
          name: "Blade Ward",
          ac5eOnly: true,
          options: {
            durationSeconds: 60,
          },
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.addChange("bonus=-1d4", 20, "flags.automated-conditions-5e.grants.attack.bonus"),
          ],
        },
      ];
    }
  }

}
