import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Pronghorn Cervan: DDB's charge action ("Antler (Bonus Action)") repeats the gore's 1d6 + Strength,
 * but the charge only adds an extra 1d6 Piercing on top of the hit, so cleanup swaps its damage part.
 */
export default class Antlers extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override async cleanup(): Promise<void> {
    const activities = (this.data?.system?.activities ?? {}) as Record<string, I5eActivity>;
    for (const activity of Object.values(activities)) {
      if (activity.type !== "save" || !(/bonus action/i).test(activity.name ?? "")) continue;
      foundry.utils.setProperty(activity, "damage.parts", [
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["piercing"] }),
      ]);
    }
  }

}
