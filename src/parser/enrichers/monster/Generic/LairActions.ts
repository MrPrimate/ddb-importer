import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

interface ILairZone {
  label: string;
  template: { type: TTemplate; size: string; width?: string; height?: string; stationary?: boolean };
  /** Feet to the point of origin; null when the area is centred on something the text names. */
  range: string | null;
  duration: I5eActivityDuration;
  terrain: string[];
}

/**
 * A monster's lair actions arrive as one feature holding a list of options, and the parser turns
 * the saves in that list into activities. What it cannot express is the map: an option that makes
 * an area difficult terrain. For each such option whose text gives the area a shape, this adds a
 * placer beside the parsed activities that puts the area down as difficult terrain.
 *
 * Options with no shape are left alone on purpose. "The ceiling, floor, and walls of the lair"
 * and the regional effects ("within 1 mile of the lair") describe no area a template could be.
 * The saves many of these options also call for when a creature enters the area or starts its
 * turn there are not fired from the region: the parser names its extra saves by ability, so the
 * option's own save cannot be told apart from its neighbours' by name.
 *
 * Difficult terrain is ignored by disposition, never by one token, so an option that spares only
 * the monster itself hinders it like everyone else.
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
    [/\bslim(?:e|y)|sludge/i, "Slime"],
    [/\btentacles?/i, "Tentacles"],
    [/\bwind|gale/i, "Wind"],
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
      return { template: { type: "radius", size: `${Number(diameter[1]) / 2}`, stationary: true }, centred: true };
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
      if (!(/difficult terrain/i).test(text)) continue;
      const shape = LairActions.parseShape(text);
      if (!shape) continue;
      const terrain = LairActions.TERRAIN_WORDS.filter(([word]) => word.test(text)).map(([, type]) => type).slice(0, 1);
      // "within 120 feet of it" or a bare "within 120 feet", but never the area around the point
      const range = shape.centred ? null : (/within (\d+) feet(?! of that point)/i).exec(text)?.[1] ?? null;
      const label = LairActions.parseLabel(text, terrain, zones.length);
      zones.push({
        // two options of one monster can share a terrain word
        label: zones.some((zone) => zone.label === label) ? `${label} ${zones.length + 1}` : label,
        template: shape.template,
        range,
        duration: LairActions.parseDuration(text),
        terrain,
      });
    }
    return zones;
  }

  get zones(): ILairZone[] {
    const parser = this.ddbParser as { html?: string } | undefined;
    return LairActions.parseZones(parser?.html ?? "");
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.zones.map((zone) => regionPlacer(`Lair Terrain: ${zone.label}`, {
      template: zone.template,
      ...(zone.range ? { range: zone.range } : {}),
      activationType: "lair",
      duration: zone.duration,
      behaviors: [
        DDBEnricherData.BehaviorHelper.difficultTerrain({ types: zone.terrain }),
      ],
    }));
  }

  // the placers sit beside the saves the parser builds from the same list, not instead of them
  override get keepParsedActivities(): boolean {
    return true;
  }

}
