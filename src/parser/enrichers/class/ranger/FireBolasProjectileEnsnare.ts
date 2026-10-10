import DDBEnricherData from "../../data/DDBEnricherData";

/** Bolas: a creature hit by a bolas projectile saves with Strength or Dexterity (its choice) against 8 + Wisdom + proficiency or is Grappled. */
export default class FireBolasProjectileEnsnare extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        save: { ability: ["str", "dex"], dc: { calculation: "", formula: "8 + @abilities.wis.mod + @prof" } },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ensnared",
        statuses: ["grappled"],
        options: { description: "Grappled by the bolas." },
      },
    ];
  }

}
