import DDBEnricherData from "../../data/DDBEnricherData";
import DDBDescriptions from "../../../lib/DDBDescriptions";
import utils from "../../../../lib/Utils";

/** What a lair area does to a creature that enters it or starts or ends its turn there. */
interface ILairTrigger {
  /** When the area acts on a creature: "enter", "turnStart", "turnEnd". */
  events: string[];
  save: { ability: string[]; dc: string } | null;
  damageParts: I5eDamagePart[];
  onSave: "none" | "half";
  /** A dnd5e status the option inflicts, capitalised as effect hints expect it. */
  status: string | null;
  expiry: T5eEffectExpiry | null;
  excludeSelf: boolean;
}

interface ILairZone {
  label: string;
  template: { type: TTemplate; size: string; width?: string; height?: string };
  /** Feet to the point of origin; null when the area is centred on something the text names. */
  range: string | null;
  duration: I5eActivityDuration;
  /** Null when the option is an area with a trigger but is not difficult terrain. */
  terrain: string[] | null;
  trigger: ILairTrigger | null;
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
 * Options with no shape are left alone on purpose. "The ceiling, floor, and walls of the lair"
 * and the wide-area effects ("within 1 mile of the lair") describe no area a template could be.
 * Difficult terrain is marked by the template only; moving through it is left to the table.
 */
export default class LairActions extends DDBEnricherData {

  static TERRAIN_WORDS: [RegExp, string][] = [
    [/\b(?:roots?|vines?|plants?|undergrowth|foliage|thicket|grass)/i, "plants"],
    [/\b(?:snow|blizzard)/i, "snow"],
    [/\b(?:ice|icy|hail|frost|frozen)/i, "ice"],
    [/\b(?:sand|dust|quicksand)/i, "sand"],
    [/\b(?:mud|swamp|bog|mire)/i, "mud"],
    [/\b(?:water|flood|tide|wave)/i, "liquid"],
    [/\b(?:web|webbing)/i, "web"],
    [/\b(?:rubble|rocks?|stones?|spikes?|crystal)/i, "rocks"],
  ];

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

  static stripBlock(html: string): string {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&rsquo;|’/g, "'")
      .replace(/&mdash;|&ndash;/g, "-")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** The area an option describes, or null when its text gives the area no shape. */
  static parseShape(text: string): { template: ILairZone["template"]; centred: boolean } | null {
    const wall = (/up to (\d+) feet long, (\d+) feet high, and (\d+) f(?:ee|oo)t thick/i).exec(text);
    if (wall) return { template: { type: "wall", size: wall[1], height: wall[2], width: wall[3] }, centred: false };

    const cylinder = (/cylinder[^.]*?(\d+)[- ]foot[- ]radius|(\d+)[- ]foot[- ]radius[^.]*?cylinder/i).exec(text);
    if (cylinder) {
      const height = (/(\d+) feet (?:tall|high)|(\d+)[- ]foot[- ](?:tall|high)/i).exec(text);
      return {
        template: { type: "cylinder", size: cylinder[1] ?? cylinder[2], ...(height ? { height: height[1] ?? height[2] } : {}) },
        centred: false,
      };
    }

    const sphere = (/(\d+)[- ]foot[- ]radius sphere/i).exec(text);
    if (sphere) return { template: { type: "sphere", size: sphere[1] }, centred: false };

    // "a 100-foot diameter circle centered on the dragon" originates from the monster
    const diameter = (/(\d+)[- ]foot[- ]diameter circle/i).exec(text);
    if (diameter) {
      return { template: { type: "radius", size: `${Number(diameter[1]) / 2}` }, centred: true };
    }

    const radius = (/(\d+)[- ]foot[- ]radius/i).exec(text);
    if (radius) return { template: { type: "circle", size: radius[1] }, centred: false };

    const block = (/(\d+)[- ]foot(?:[- ]wide)? (square|cube)/i).exec(text);
    if (block) return { template: { type: block[2].toLowerCase() as TTemplate, size: block[1] }, centred: false };

    const aroundPoint = (/area within (\d+) feet of that point/i).exec(text);
    if (aroundPoint) return { template: { type: "circle", size: aroundPoint[1] }, centred: false };

    // "the air within 60 feet of the vessel": an area around something that is not the monster
    const aroundObject = (/\b(?:air|area|ground) within (\d+) feet of the (?:vessel|ship)/i).exec(text);
    if (aroundObject) return { template: { type: "circle", size: aroundObject[1] }, centred: true };

    return null;
  }

  static STATUSES = ["blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated", "paralyzed",
    "petrified", "poisoned", "prone", "restrained", "stunned"];

  /**
   * What the area does after it appears, or null when the option only acts once. The save and
   * damage are read from the trigger's own sentence onwards; an option that says a creature "must
   * also make this saving throw" there restates nothing, so it falls back to the option's save.
   */
  static parseTrigger(text: string): ILairTrigger | null {
    const events: string[] = [];
    const enter = (/\b(?:enters?|moves? into|flies into|move through)\b/i).exec(text);
    const start = (/\bstarts? (?:its|their|his|her) turn\b/i).exec(text);
    const end = (/\bends? (?:its|their|his|her) turn\b/i).exec(text);
    if (enter) events.push("enter");
    if (start) events.push("turnStart");
    if (end) events.push("turnEnd");
    if (events.length === 0) return null;

    const first = Math.min(...[enter, start, end].filter((match) => match !== null).map((match) => match.index));
    const sentenceStart = Math.max(text.lastIndexOf(". ", first) + 2, 0);
    const tail = text.slice(sentenceStart);

    // "A creature must also make this saving throw when it enters..." restates nothing, so the
    // option's own save and damage apply. Any other trigger sentence stands alone: an area that
    // just "takes 3d6 damage" on a later turn has no save, whatever the option rolled as it appeared.
    const restated = (/\b(?:this|that|the same|the) sav(?:e|ing throw)\b/i).test(tail);
    const own = DDBDescriptions.parseSaves(tail);
    const parsed = own[0] ?? (restated ? DDBDescriptions.parseSaves(text).at(-1) : null) ?? null;
    const save = parsed?.dc.formula ? { ability: parsed.ability, dc: parsed.dc.formula } : null;
    const scope = own.length === 0 && restated ? text : tail;
    const { parts } = DDBDescriptions.parseDamageParts(scope);
    // "1d8 piercing damage for every 5 feet it moves" is a cost of moving, not of being there
    const damageParts = (/for every \d+ feet/i).test(scope) ? [] : parts;
    // the first condition named is the one the trigger inflicts; later ones qualify it
    // ("poisoned... While poisoned in this way, a creature is incapacitated")
    const status = LairActions.STATUSES
      .map((name) => ({ name, index: scope.search(new RegExp(`\\b${name}\\b`, "i")) }))
      .filter((found) => found.index >= 0)
      .sort((a, b) => a.index - b.index)[0]?.name ?? null;
    if (!save && damageParts.length === 0 && !status) return null;

    return {
      events,
      save,
      damageParts,
      onSave: DDBDescriptions.halfOnSave(scope) ? "half" : "none",
      status: status ? status.charAt(0).toUpperCase() + status.slice(1) : null,
      expiry: DDBDescriptions.nextTurnExpiry(scope)?.expiry ?? null,
      excludeSelf: (/\bother than (?:the|it|him|her)\b|\bis unaffected\b|\bexcept\b/i).test(text),
    };
  }

  static parseDuration(text: string): I5eActivityDuration {
    if ((/until (?:the end of )?initiative count 20 on the next round/i).test(text)) return { value: "1", units: "round" };
    const timed = (/(?:remains|lasts|persists) for (\d+) (minute|hour)s?/i).exec(text);
    if (timed) return { value: timed[1], units: timed[2].toLowerCase() === "hour" ? "hour" : "minute" };
    return { units: "spec", special: "Until this lair action is used again or the creature dies" };
  }

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
      const words = LairActions.TERRAIN_WORDS.filter(([word]) => word.test(text)).map(([, type]) => type).slice(0, 1);
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

  static triggerCondition(trigger: ILairTrigger): string {
    const when = [
      trigger.events.includes("enter") ? "enters the area" : null,
      trigger.events.includes("turnStart") ? "starts its turn there" : null,
      trigger.events.includes("turnEnd") ? "ends its turn there" : null,
    ].filter((phrase) => phrase !== null);
    return `A creature${trigger.excludeSelf ? " other than the monster" : ""} ${when.join(" or ")}`;
  }

  get zones(): ILairZone[] {
    const parser = this.ddbParser as { html?: string } | undefined;
    return LairActions.parseZones(parser?.html ?? "");
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
  static fired(name: string, trigger: ILairTrigger): IDDBAdditionalActivity {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

}
