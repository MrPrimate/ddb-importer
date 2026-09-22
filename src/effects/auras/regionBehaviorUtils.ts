interface IRegionActivity extends Record<string, unknown> {
  id?: string;
  name?: string;
  item?: {
    system: {
      activities: {
        get?: (id: string) => IRegionActivity | undefined;
        find?: (predicate: (activity: IRegionActivity) => boolean) => IRegionActivity | undefined;
      };
    };
  };
}

/** Exact names win; prefix matching supports a surviving variant of a named activity family. */
export function resolveRegionActivity(
  placing: IRegionActivity,
  { activityId, activityName }: Pick<IUseActivityArgs, "activityId" | "activityName">,
): IRegionActivity | null {
  const activities = placing.item?.system.activities;
  if (activityId) return activities?.get?.(activityId) ?? null;
  if (!activityName) return placing;
  return (
    activities?.find?.((activity) => activity.name === activityName) ??
    activities?.find?.((activity) => activity.name?.startsWith(activityName) ?? false) ??
    null
  );
}

/** Most areas need only their name; simultaneous same-named areas need a stable distinction. */
export function regionLabel(region: RegionDocument): string {
  const name = region.name ?? "Region";
  const collision = region.parent?.regions.some((other) => other !== region && other.name === region.name);
  return collision ? `${name} (${region.id})` : name;
}

/** The fallback clock cannot pre-empt the owner's next turn or a failed use kept for recovery. */
export function ownerTurnExpired(behavior: RegionBehavior): boolean {
  const args = foundry.utils.getProperty(behavior, "flags.ddbimporter.ownerTurn.args") as IUseActivityArgs | undefined;
  if (!args?.ownerTurn) return false;
  if (args.expiresAt !== undefined && args.expiresAt <= game.time.worldTime) return true;
  if (args.fallbackExpiresAt === undefined) return false;
  if (foundry.utils.getProperty(behavior, "flags.ddbimporter.ownerTurnState.oneShotClaimed")) return false;
  if (args.placementCombatId) return !game.combats.get(args.placementCombatId)?.started;
  const origin = behavior.parent?.getFlag("dnd5e", "origin");
  const inCombat = game.combats.some(
    (combat) => combat.started && combat.combatants.some((combatant) => combatant.token?.uuid === origin),
  );
  return !inCombat && args.fallbackExpiresAt <= game.time.worldTime;
}
