import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityPathToTheGrave extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
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
    ];
  }
}
