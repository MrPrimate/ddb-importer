import DDBEnricherData from "../data/DDBEnricherData";

/**
 * 2014 banishes a target the hit leaves at 50 Hit Points or fewer outright; 2024 gives it a
 * Charisma save first. In 2024 the cast is the save activity carrying Incapacitated, its damage
 * never halved (it is part of the hit) and able to crit.
 */
export default class BanishingSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014
      ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE
      : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      allowCritical: true,
      ...(this.is2014 ? {} : { data: { damage: { onSave: "full" } } }),
    };
  }

}
