import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shadow Stalker: the Shadow Mote pool (rogue level per long rest) fuels Shadow Scout, Shadow Swap and
 * Vexing Shadow, one mote each, and reducing a hostile creature to 0 hit points returns one.
 */
export default class ShadowMotes extends DDBEnricherData {

  static MOTE_ACTIONS = ["Shadow Scout", "Shadow Swap", "Vexing Shadow"];

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: { name: "Regain Shadow Mote", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "special", value: 1, condition: "You reduce a Hostile creature to 0 Hit Points" },
        },
        overrides: { targetSelf: true, addItemConsume: true, itemConsumeValue: "-1" },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Vexing Shadow",
        activityMatch: "Vexing Shadow",
        statuses: ["invisible"],
        options: { durationSeconds: 12, description: "Invisible to the creature you hit until the end of your next turn." },
      },
    ];
  }

  // DDB's three mote actions spend nothing; each costs one mote from this feature's pool
  override async cleanup(): Promise<void> {
    const activities = (this.data?.system?.activities ?? {}) as Record<string, I5eActivity>;
    for (const activity of Object.values(activities)) {
      if (!ShadowMotes.MOTE_ACTIONS.includes(activity.name ?? "")) continue;
      const targets = activity.consumption?.targets ?? [];
      if (targets.some((target) => target.type === "itemUses")) continue;
      foundry.utils.setProperty(activity, "consumption.targets", [
        ...targets,
        { type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
      ]);
    }
  }

}
