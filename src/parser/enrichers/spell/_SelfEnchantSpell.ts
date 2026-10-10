import DDBEnricherData from "../data/DDBEnricherData";

export { riders } from "../data/SelfEnchant";

/**
 * Helpers for spells cast as a self-enchantment on the spell itself, whose profiles carry the
 * activities used while the spell lasts as activity riders (and the caster's own effects as
 * effect riders). dnd5e hides a rider activity on its item until the enchantment is applied, so
 * those activities only appear while the spell is active, and they go when it ends or when
 * concentration on it is lost.
 *
 * Using the cast again removes the enchantment, which ends the spell early. dnd5e runs that use
 * like any other, so while the enchantment is applied the cast is renamed for what it now does,
 * spends no slot, and begins no concentration (a new concentration effect would replace the
 * spell's and be tied to nothing). Ending the spell this way leaves the concentration effect for
 * the caster to drop, as dnd5e does not tie it to the enchantment in that direction.
 *
 * Rider activities need `durationOverride: { units: "inst", concentration: false }` (with
 * `generateDuration: true`): the copy dnd5e makes is not a rider, so it would otherwise inherit the
 * spell's concentration and using it would end the spell.
 */

/**
 * The cast activity's data: a self-enchant with a fixed id the profile changes can name. A cast that
 * places an area (`keepTemplate`, with its target and region behaviors in `data`) keeps its own
 * target; any other targets the caster with no template.
 */
export function selfEnchantCast(
  { name = "Cast", id, data = {}, keepTemplate = false }: { name?: string; id: string; data?: Partial<I5eActivity>; keepTemplate?: boolean },
): IDDBActivityData {
  return {
    name,
    id,
    ...(keepTemplate ? {} : { targetSelf: true, noTemplate: true }),
    // the spread widens the literal past the activity union, so it is narrowed back
    data: {
      ...data,
      enchant: {
        self: true,
      },
    } as Partial<I5eActivity>,
  };
}

/**
 * Changes every profile makes to the cast activity while applied, turning it into the free "end"
 * use. `cast` is the activity's id, or the `activities[enchant]` selector for a spell whose only
 * enchant activity is the cast. `clearTemplate` is for a cast that places an area, which the ending
 * use must not place again.
 */
export function endSpellChanges(cast: string, endName: string, { clearTemplate = false }: { clearTemplate?: boolean } = {}): IActiveEffectChangeData[] {
  const path = cast.startsWith("activities[") ? cast : `system.activities.${cast}`;
  return [
    DDBEnricherData.ChangeHelper.overrideChange(endName, 20, `${path}.name`),
    DDBEnricherData.ChangeHelper.overrideChange("false", 20, `${path}.consumption.spellSlot`),
    // the activity only keeps its own duration over the spell's when it overrides it
    DDBEnricherData.ChangeHelper.overrideChange("true", 20, `${path}.duration.override`),
    DDBEnricherData.ChangeHelper.overrideChange("false", 20, `${path}.duration.concentration`),
    ...(clearTemplate
      ? [DDBEnricherData.ChangeHelper.overrideChange("", 20, `${path}.target.template.type`)]
      : []),
  ];
}

/**
 * One `effectIdLevel` band per slot level from `base` up, the top one open-ended. A spell whose
 * follow-up scales with the slot gives each level its own profile; the usage dialog picks it from
 * the cast level (a scripted `use` with `configure: false` picks from the unscaled spell, so pass
 * `enchantmentProfile` there).
 */
export function slotLevels(base: number, max = 9): { level: number; effectIdLevel: { min: number; max: number | null } }[] {
  const levels = [];
  for (let level = base; level <= max; level++) {
    levels.push({ level, effectIdLevel: { min: level, max: level === max ? null : level } });
  }
  return levels;
}

/**
 * Changes fixing the spell at the level it was cast at while the profile is applied, through the
 * flag dnd5e reads for a scaled spell scroll: every activity on the spell, its riders included,
 * then rolls at that level, and the usage dialog offers no "Cast at" level to pick again (which
 * would otherwise scale the follow-up a second time). The values are numbers, as the flag has no
 * schema to cast a string against.
 */
export function castLevelChanges(level: number, base: number): IActiveEffectChangeData[] {
  return [
    // literal changes: overrideChange would stringify the numbers
    { key: "flags.dnd5e.spellLevel.value", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: level, priority: 20 },
    { key: "flags.dnd5e.spellLevel.base", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: base, priority: 20 },
  ];
}
