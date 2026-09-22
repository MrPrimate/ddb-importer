import DDBEnricherData from "../../data/DDBEnricherData";
import utils from "../../../../lib/Utils";
import { STATUSES, TERRAIN_WORDS, parseDuration, parseShape, parseTrigger, stripBlock, terrainTypes } from "./_ZoneText";
import { linkMonsterSummons, monsterSummon } from "../_MonsterSummons";
import { monsterLinksToResidue, parseSummon } from "./_SummonText";

type TLairTrigger = NonNullable<ReturnType<typeof parseTrigger>>;

interface ILairZone {
  label: string;
  template: { type: TTemplate; size: string; width?: string; height?: string };
  /** Feet to the point of origin; null when the area is centred on something the text names. */
  range: string | null;
  duration: I5eActivityDuration;
  /** Null when the option is an area with a trigger but is not difficult terrain. */
  terrain: string[] | null;
  trigger: TLairTrigger | null;
}

interface ILairSummon {
  label: string;
  creatures: { name: string; count: string; label?: string; ddbId?: number }[];
  range: string | null;
  duration: { value: string; units: TDurationUnit } | null;
}

/**
 * A monster's lair actions arrive as one feature holding a list of options, and the parser turns
 * the saves in that list into activities. What it cannot express is the map: an option that makes
 * an area difficult terrain, or one whose area keeps acting on a creature that enters it or
 * starts or ends its turn there. For each such option whose text gives the area a shape, this
 * adds a placer beside the parsed activities that draws the area, and a trigger activity to roll
 * by hand against a creature the area acts on later.
 *
 * The parser names its extra saves by ability and leaves the first unnamed, so an option's own
 * save cannot be picked out by name. The trigger is built from the option's text instead, with
 * the shared description parsers; the parsed save stays as the roll made when the area appears.
 *
 * An option that calls creatures ("causes four gas spores ... to appear") gets a summon beside
 * them, linked to the monster compendium afterwards. Only names that carry D&D Beyond's tag
 * residue or name their stat block count here: a lair's prose is full of things that "appear".
 *
 * Options with no shape are left alone on purpose. "The ceiling, floor, and walls of the lair"
 * and the wide-area effects ("within 1 mile of the lair") describe no area a template could be.
 * Difficult terrain is marked by the template only; moving through it is left to the table.
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
      const { stationary: _stationary, ...template } = shape.template;
      zones.push({
        // two options of one monster can share a terrain word
        label: zones.some((zone) => zone.label === label) ? `${label} ${zones.length + 1}` : label,
        template,
        range,
        duration: LairActions.parseDuration(text),
        terrain: isTerrain ? words : null,
        trigger,
      });
    }
    return zones;
  }

  static parseSummons(html: string): ILairSummon[] {
    const summons: ILairSummon[] = [];
    const linked = monsterLinksToResidue(html);
    const blocks = linked.html.split(/<\/li>|<\/p>/i).map((block) => LairActions.stripBlock(block));
    for (const text of blocks) {
      const summon = parseSummon(text);
      if (!summon?.tagged || summon.creatures.length === 0) continue;
      // "Sound the Horn (1/Day). ...": an option that names itself, with or without a limit after it
      const lead = (/^([A-Z][A-Za-z' -]{2,40})(?: \([^)]*\))?\.\s/).exec(text);
      const label = lead && lead[1].trim().split(/\s+/).length <= 5 ? lead[1].trim() : summon.creatures[0].name;
      if (summons.some((other) => other.label === label)) continue;
      summons.push({
        label,
        creatures: summon.creatures.map((creature) => ({
          name: creature.name,
          count: creature.count,
          ...(linked.ids.has(creature.name.toLowerCase()) ? { ddbId: linked.ids.get(creature.name.toLowerCase()) } : {}),
          ...(creature.upTo ? { label: `${creature.name} (up to ${creature.count})` } : {}),
        })),
        range: summon.range,
        duration: summon.duration,
      });
    }
    return summons;
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
    return `A creature${trigger.excludeSelf ? " other than the monster" : ""} ${when.join(" or ")}`;
  }

  get zones(): ILairZone[] {
    const parser = this.ddbParser as { html?: string } | undefined;
    return LairActions.parseZones(parser?.html ?? "");
  }

  get summons(): ILairSummon[] {
    const parser = this.ddbParser as { html?: string } | undefined;
    return LairActions.parseSummons(parser?.html ?? "");
  }

  /** Draws the area; it rolls nothing and spends nothing. */
  static placer(name: string, zone: ILairZone): IDDBAdditionalActivity {
    const range: I5eActivityRange = zone.range
      ? { override: true, value: zone.range, units: "ft" }
      : { override: true, value: null, units: "self", special: "" };
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
      build: {
        generateSave: false,
        generateDamage: false,
        generateActivation: true,
        generateTarget: true,
        generateRange: true,
        generateDuration: true,
        generateConsumption: false,
        activationOverride: { type: "lair", value: null, condition: "" },
        targetOverride: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", ...zone.template },
        },
        rangeOverride: range,
        durationOverride: { override: true, ...zone.duration },
      },
      overrides: {
        noConsumeTargets: true,
        noeffect: true,
      },
    };
  }

  /** What the area does to one creature later on. It places nothing: the area already exists. */
  static fired(name: string, trigger: TLairTrigger): IDDBAdditionalActivity {
    const hasDamage = trigger.damageParts.length > 0;
    let type: IDDBActivityType = DDBEnricherData.ACTIVITY_TYPES.UTILITY;
    if (trigger.save) type = DDBEnricherData.ACTIVITY_TYPES.SAVE;
    else if (hasDamage) type = DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
    return {
      init: { name, type },
      build: {
        generateSave: Boolean(trigger.save),
        generateDamage: hasDamage,
        ...(trigger.save
          ? { saveOverride: { ability: trigger.save.ability, dc: { calculation: "", formula: trigger.save.dc } } }
          : {}),
        ...(hasDamage ? { damageParts: trigger.damageParts } : {}),
        generateActivation: true,
        generateConsumption: false,
        generateTarget: true,
        generateRange: true,
        activationOverride: { type: "special", value: null, condition: LairActions.triggerCondition(trigger) },
        targetOverride: {
          override: true,
          affects: { count: "1", type: "creature" },
          template: {},
        },
        rangeOverride: { override: true, value: null, units: "self", special: "" },
      },
      overrides: {
        noConsumeTargets: true,
        noTemplate: true,
        data: {
          ...(trigger.save ? { damage: { onSave: trigger.onSave } } : {}),
        },
      },
    };
  }

  get summonActivities(): IDDBAdditionalActivity[] {
    return this.summons.map((summon) => monsterSummon(`Lair Summon: ${summon.label}`, {
      creatures: summon.creatures,
      activationType: "lair",
      ...(summon.range ? { range: summon.range } : {}),
      ...(summon.duration ? { duration: summon.duration } : {}),
    }));
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [...this.zoneActivities, ...this.summonActivities];
  }

  get zoneActivities(): IDDBAdditionalActivity[] {
    return this.zones.flatMap((zone) => {
      const { trigger } = zone;
      const placer = LairActions.placer(`${trigger ? "Lair Area" : "Lair Terrain"}: ${zone.label}`, zone);
      if (!trigger) return [placer];

      const fired = LairActions.fired(LairActions.triggerName(zone), trigger);
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
        ...(zone.trigger!.expiry ? { expiry: zone.trigger!.expiry, durationSeconds: 6, durationRounds: 1 } : {}),
      },
    }));
  }

  // the placers sit beside the saves the parser builds from the same list, not instead of them
  override get keepParsedActivities(): boolean {
    return true;
  }

  override async cleanup(): Promise<void> {
    await linkMonsterSummons(this.data, this.summons.flatMap((summon) => summon.creatures), this.is2024);
  }

}
