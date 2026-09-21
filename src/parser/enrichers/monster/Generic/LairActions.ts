import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../../data/RegionBuilders";
import utils from "../../../../lib/Utils";
import { STATUSES, TERRAIN_WORDS, parseDuration, parseShape, parseTrigger, stripBlock, terrainTypes } from "./_ZoneText";

type TLairTrigger = NonNullable<ReturnType<typeof parseTrigger>>;

interface ILairZone {
  label: string;
  template: { type: TTemplate; size: string; width?: string; height?: string; stationary?: boolean };
  /** Feet to the point of origin; null when the area is centred on something the text names. */
  range: string | null;
  duration: I5eActivityDuration;
  /** Null when the option is an area with a trigger but is not difficult terrain. */
  terrain: string[] | null;
  trigger: TLairTrigger | null;
}

/**
 * A monster's lair actions arrive as one feature holding a list of options, and the parser turns
 * the saves in that list into activities. What it cannot express is the map: an option that makes
 * an area difficult terrain, or one whose area keeps acting on a creature that enters it or
 * starts or ends its turn there. For each such option whose text gives the area a shape, this
 * adds a placer beside the parsed activities, carrying the terrain and the region trigger.
 *
 * The parser names its extra saves by ability and leaves the first unnamed, so an option's own
 * save cannot be picked out by name for a region to fire. The trigger is built from the option's
 * text instead, with the shared description parsers; the parsed save stays as the roll made when
 * the area appears.
 *
 * Options with no shape are left alone on purpose. "The ceiling, floor, and walls of the lair"
 * and the regional effects ("within 1 mile of the lair") describe no area a template could be.
 * Difficult terrain is ignored by disposition, never by one token, so an option that spares only
 * the monster itself still hinders it; a trigger can skip the monster, and does when told to.
 */
export default class LairActions extends DDBEnricherData {

  // the shared readers live in _ZoneText; these names are what the lair tests and callers use
  static TERRAIN_WORDS = TERRAIN_WORDS;

  /** Names for an option whose terrain has no dnd5e type and whose text leads with no name of its own. */
  static LABEL_WORDS: [RegExp, string][] = [
    [/\bfog\b/i, "Fog"],
    [/\bgas(?:es)?\b/i, "Gas"],
    [/\binsects?\b|\bvermin\b/i, "Insects"],
    [/\bthorns?\b/i, "Thorns"],
    [/\bspores?\b/i, "Spores"],
    [/\bslim(?:e|y)\b|\bsludge\b/i, "Slime"],
    [/\btentacles?\b/i, "Tentacles"],
    [/\bmagma\b|\blava\b/i, "Magma"],
    [/\bfire\b|\bflames?\b/i, "Fire"],
    [/\bwater\b/i, "Water"],
    [/\bdarkness\b|\bshadows?\b/i, "Shadow"],
    [/\bwall\b/i, "Wall"],
    [/\bcloud\b/i, "Cloud"],
    [/\bwind\b|\bgale\b/i, "Wind"],
  ];

  static stripBlock = stripBlock;

  static parseShape = parseShape;

  static STATUSES = STATUSES;

  static parseTrigger = parseTrigger;

  static parseDuration = parseDuration;

  /** "Blinding Wind. Sand and dust..." leads with its own name; most legacy options do not. */
  static parseLabel(text: string, terrain: string[], index: number): string {
    const lead = (/^([A-Z][A-Za-z' -]{2,40})\.\s/).exec(text);
    if (lead && lead[1].trim().split(/\s+/).length <= 5) return lead[1].trim();
    if (terrain.length > 0) return terrain[0].charAt(0).toUpperCase() + terrain[0].slice(1);
    const word = LairActions.LABEL_WORDS.find(([pattern]) => pattern.test(text));
    return word ? word[1] : `Area ${index + 1}`;
  }

  static parseZones(html: string): ILairZone[] {
    const zones: ILairZone[] = [];
    const blocks = `${html ?? ""}`.split(/<\/li>|<\/p>/i).map((block) => LairActions.stripBlock(block));
    for (const text of blocks) {
      const isTerrain = (/difficult terrain/i).test(text);
      const trigger = LairActions.parseTrigger(text);
      if (!isTerrain && !trigger) continue;
      const shape = LairActions.parseShape(text);
      if (!shape) continue;
      const words = terrainTypes(text);
      // "within 120 feet of it" or a bare "within 120 feet", but never the area around the point
      const range = shape.centred ? null : (/within (\d+) feet(?! of that point)/i).exec(text)?.[1] ?? null;
      const label = LairActions.parseLabel(text, words, zones.length);
      zones.push({
        // two options of one monster can share a terrain word
        label: zones.some((zone) => zone.label === label) ? `${label} ${zones.length + 1}` : label,
        template: shape.template,
        range,
        duration: LairActions.parseDuration(text),
        terrain: isTerrain ? words : null,
        trigger,
      });
    }
    return zones;
  }

  static triggerName(zone: ILairZone): string {
    if (zone.trigger?.save) return `${zone.label} Save`;
    return (zone.trigger?.damageParts.length ?? 0) > 0 ? `${zone.label} Damage` : `${zone.label} Effect`;
  }

  static effectId(zone: ILairZone): string {
    return utils.namedIDStub(`lair ${zone.label}`, { prefix: "ddb", postfix: "ef" });
  }

  static triggerCondition(trigger: TLairTrigger): string {
    const when = [
      trigger.events.includes("tokenEnter") ? "enters the area" : null,
      trigger.events.includes("tokenTurnStart") ? "starts its turn there" : null,
      trigger.events.includes("tokenTurnEnd") ? "ends its turn there" : null,
    ].filter((phrase) => phrase !== null);
    return `A creature ${when.join(" or ")}`;
  }

  get zones(): ILairZone[] {
    const parser = this.ddbParser as { html?: string } | undefined;
    return LairActions.parseZones(parser?.html ?? "");
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.zones.flatMap((zone) => {
      const { trigger } = zone;
      const placer = regionPlacer(`${trigger ? "Lair Area" : "Lair Terrain"}: ${zone.label}`, {
        template: zone.template,
        ...(zone.range ? { range: zone.range } : {}),
        activationType: "lair",
        duration: zone.duration,
        behaviors: [
          ...(zone.terrain ? [DDBEnricherData.BehaviorHelper.difficultTerrain({ types: zone.terrain })] : []),
          ...(trigger
            ? [DDBEnricherData.BehaviorHelper.activity({
              events: trigger.events,
              activityName: LairActions.triggerName(zone),
              ...(trigger.excludeSelf ? { excludeSelf: true } : {}),
            })]
            : []),
        ],
      });
      if (!trigger) return [placer];

      const fired = regionTrigger(LairActions.triggerName(zone), {
        condition: LairActions.triggerCondition(trigger),
        ...(trigger.save ? { save: trigger.save, onSave: trigger.onSave } : {}),
        damageParts: trigger.damageParts,
      });
      // An activity with no effect links of its own picks up every unmatched effect the parser
      // made for the other options. Linking its own effect here makes the linker leave it alone;
      // one with nothing to apply opts out instead.
      if (trigger.status) {
        foundry.utils.setProperty(fired, "overrides.data.effects", [{
          _id: LairActions.effectId(zone),
          level: { min: null, max: null },
          riders: { activity: [], effect: [], item: [] },
        }]);
      } else {
        foundry.utils.setProperty(fired, "overrides.noeffect", true);
      }
      return [placer, fired];
    });
  }

  override get effects(): IDDBEffectHint[] {
    return this.zones.filter((zone) => zone.trigger?.status).map((zone) => ({
      name: `${zone.label}: ${zone.trigger!.status}`,
      activityMatch: LairActions.triggerName(zone),
      statuses: [zone.trigger!.status!] as IDDBEffectHint["statuses"],
      data: { _id: LairActions.effectId(zone) },
      options: {
        transfer: false,
        ...(zone.trigger!.expiry ? { expiry: zone.trigger!.expiry, durationSeconds: null } : {}),
      },
    }));
  }

  // the placers sit beside the saves the parser builds from the same list, not instead of them
  override get keepParsedActivities(): boolean {
    return true;
  }

}
