import DDBEnricherData from "../data/DDBEnricherData";

export default class Resurrection extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "10000",
          types: ["healing"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const keys = [
      "system.bonuses.abilities.check",
      "system.bonuses.abilities.save",
      "system.attributes.init.bonus",
      "system.bonuses.mwak.attack",
      "system.bonuses.msak.attack",
      "system.bonuses.rwak.attack",
      "system.bonuses.rsak.attack",
    ];
    return [1, 2, 3, 4].map((day) => {
      return {
        name: `Resurrection Penalty (Day ${day})`,
        changes: keys.map((key) => DDBEnricherData.ChangeHelper.addChange(`-${5 - day}`, 99, key)),
      };
    });
  }
}
