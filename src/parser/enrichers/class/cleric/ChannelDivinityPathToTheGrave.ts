import DDBEnricherData from "../../data/DDBEnricherData";

// 2014 version
export default class ChannelDivinityPathToTheGrave extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return this.is2014 ? [
      {
        name: "Cursed",
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["isDamaged" as const],
        changes: DDBEnricherData.allDamageTypes().map((damageType) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(damageType, 200, "system.traits.dv.value"),
        ),
      },
    ] : [];
  }
}
