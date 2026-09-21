import DDBEnricherData from "../../data/DDBEnricherData";
import { MOVEMENT_EVENTS, regionTrigger } from "../../data/RegionBuilders";
import DDBDescriptions from "../../../lib/DDBDescriptions";
import utils from "../../../../lib/Utils";
import { parseShape, parseTrigger, terrainTypes } from "./_ZoneText";

type TZoneTrigger = NonNullable<ReturnType<typeof parseTrigger>>;

interface IZoneTarget {
  template: { type: TTemplate; size: string; width?: string; height?: string; stationary?: boolean };
  /** Feet to the point of origin, for an area set down at range. */
  range: string | null;
}

interface IParsedAction {
  strippedHtml?: string;
  html?: string;
  isSave?: boolean;
  type?: string;
  actionData?: {
    damageParts?: unknown[];
    healingParts?: unknown[];
    target?: { template?: { type?: string | null; size?: string | number | null } };
  };
}

const MOVEMENT_DAMAGE = "Movement Damage";

/**
 * Monster actions and traits that put an area on the map which keeps acting: a cloud, web or
 * pool that a creature saves against when it enters or starts or ends its turn there, ground left
 * as difficult terrain, or spikes that cut for every 5 feet moved. The parser has already built
 * the roll and, usually, the template; what is missing is the region behaviour, so this reads the
 * trait text and adds only that.
 *
 * A region re-uses an activity without spending its uses or placing a second template, so where
 * the area's later roll is the roll the action makes anyway, the region fires the action's own
 * activity. A sibling is built only when the text rolls one thing as the area appears and another
 * afterwards (a breath that deals damage, then a fog that only poisons), and then the parser's
 * own activities are kept beside it.
 *
 * Several of these names are ordinary actions on other monsters (a dragon's Poison Breath, a
 * mephit's Death Burst), so text with no zone wording changes nothing.
 */
export default class PlacedZone extends DDBEnricherData {

  static ZONE_WORDING = /for the first time on (?:a|its|each|their) turn|\b(?:starts?|ends?) (?:its|their|his|her) turn (?:there|in\b|within\b)/i;

  // the save belongs to something the monster left behind or marked, which is not a token of its own
  static NOT_THE_MONSTER = /turn within \d+ feet of the (?:sphere|smeared|poisoned|target)/i;

  // an area the text ties to the monster rather than to where it stood: it says so, calls it an
  // aura, or measures the trigger from the monster ("ends its turn within 30 feet of Zargon")
  static MOVES_WITH = /\bmoves? with\b|remain(?:s|ing) centered on|\baround (?:itself|himself|herself|themselves|[A-Z])|\bfrom its skin\b|\baura\b|\bshrouds? (?:itself|himself|herself)\b|turn within \d+ feet of/;

  static MOVEMENT_DAMAGE = /for (?:every|each) (\d+) feet (?:it|they) (?:moves?|travels?)/i;

  get parser(): IParsedAction {
    return (this.ddbParser ?? {}) as IParsedAction;
  }

  /**
   * The monster feature parser's raw text. The document description is not built when the
   * activity hook runs, so `this.document` is not usable here.
   */
  get text(): string {
    // DDB hyphenates "10-foot" with a soft hyphen as well in places, which no shape wording expects
    return (this.parser.strippedHtml ?? this.parser.html ?? "").replace(/\u00AD/g, "").replace(/’/g, "'");
  }

  get isTerrain(): boolean {
    return (/\b(?:is|are|becomes?|and) difficult terrain\b/i).test(this.text);
  }

  get trigger(): TZoneTrigger | null {
    const text = this.text;
    if (!PlacedZone.ZONE_WORDING.test(text) || PlacedZone.NOT_THE_MONSTER.test(text)) return null;
    return parseTrigger(text);
  }

  /** The sentence that prices movement through the area, or null. */
  get movementSentence(): string | null {
    const match = PlacedZone.MOVEMENT_DAMAGE.exec(this.text);
    if (!match) return null;
    const start = Math.max(this.text.lastIndexOf(". ", match.index) + 2, 0);
    return this.text.slice(start);
  }

  get isZone(): boolean {
    return this.isTerrain || this.trigger !== null || this.movementSentence !== null;
  }

  /** An always-on trait has no moment it was set down, so its ground goes where the monster goes. */
  get movesWithMonster(): boolean {
    return this.hasNoParsedActivity || PlacedZone.MOVES_WITH.test(this.text);
  }

  /**
   * The terrain type, read from the sentence that names the terrain and no further: the wider
   * text is full of false friends (a "shock wave", a troll's "roots", the monster's own name).
   */
  get terrain(): string[] {
    const text = this.text;
    const at = text.search(/difficult terrain/i);
    const start = Math.max(text.lastIndexOf(". ", at) + 2, 0);
    const end = text.indexOf(". ", at);
    return terrainTypes(text.slice(start, end < 0 ? undefined : end));
  }

  /**
   * True when the text rolls something as the area appears and the trigger sentence then rolls
   * something else, rather than saying a creature "must also" make the same save.
   */
  get triggerNeedsSibling(): boolean {
    const trigger = this.trigger;
    if (!trigger) return false;
    const text = this.text;
    const first = PlacedZone.ZONE_WORDING.exec(text)?.index ?? 0;
    const sentenceStart = Math.max(text.lastIndexOf(". ", first) + 2, 0);
    const head = text.slice(0, sentenceStart);
    const tail = text.slice(sentenceStart);
    if ((/\bmust also\b|\b(?:this|that|the same) sav(?:e|ing throw)\b/i).test(tail)) return false;
    return DDBDescriptions.parseSaves(head).length > 0 || DDBDescriptions.parseDamageParts(head).parts.length > 0;
  }

  /** Movement damage is a roll of its own beside a save; an action that only deals it fires itself. */
  get movementNeedsSibling(): boolean {
    return this.movementSentence !== null && this.parser.isSave === true;
  }

  /** A trait the parser gives no activity: no save, no dice, and nothing to spend. */
  get hasNoParsedActivity(): boolean {
    const data = this.parser.actionData;
    return this.parser.type === "special"
      && !this.parser.isSave
      && (data?.damageParts ?? []).length === 0
      && (data?.healingParts ?? []).length === 0;
  }

  /** The area, when the parser found none, found one that should follow the monster, or misread a range as a size. */
  get target(): IZoneTarget | null {
    const text = this.text;
    const parsed = this.parser.actionData?.target?.template;
    const parsedSize = parsed?.size ? `${parsed.size}` : null;
    const shape = parseShape(text);
    const diameter = (/(\d+)[- ]foot[- ]diameter sphere/i).exec(text);
    const line = (/(\d+)[- ]foot[- ]wide, (\d+)[- ]foot[- ]long line/i).exec(text);
    const around = (/\b(?:within|out to) (\d+) feet of (?:it|itself|him|her|them|the [a-z' -]{2,30}|[A-Z][\w']+)\b|\b(\d+) feet in every direction/).exec(text);
    const range = (/within (\d+) feet(?! of that point)/i).exec(text)?.[1] ?? null;

    if (this.movesWithMonster) {
      const size = shape?.template.size ?? parsedSize ?? around?.[1] ?? around?.[2] ?? null;
      if (!size) return null;
      if (parsed?.type === "radius" && parsedSize === size) return null;
      return { template: { type: "radius", size }, range: null };
    }

    if (parsedSize) {
      // "a 10-foot square centered on a point within 30 feet" read as a 30-foot radius
      const misread = shape && !shape.centred && parsed?.type === "radius" && parsedSize === range && shape.template.size !== parsedSize;
      if (misread) return { template: shape.template, range };
      // a burst or cloud centred on the monster stays where it was made; only a radius would follow
      return parsed?.type === "radius" ? { template: { type: "radius", size: parsedSize, stationary: true }, range: null } : null;
    }

    if (line) return { template: { type: "line", size: line[2], width: line[1] }, range: null };
    // "a 10-foot radius of gas extends out from the dretch": centred on the monster, and it stays
    const onMonster = (/centered on (?:itself|himself|herself|the (?!point)[a-z]+)|extends? out from|\baround it\b/i).test(text);
    if (shape && onMonster && ["circle", "radius"].includes(shape.template.type)) {
      return { template: { type: "radius", size: shape.template.size, stationary: true }, range: null };
    }
    if (shape) return { template: shape.template, range: shape.centred || shape.template.type === "radius" ? null : range };
    if (diameter) return { template: { type: "sphere", size: `${Number(diameter[1]) / 2}` }, range };
    if ((/\bin (?:the|its|their) [a-z' -]{0,30}space\b/i).test(text)) return { template: { type: "square", size: "5" }, range: null };
    const size = around?.[1] ?? around?.[2] ?? null;
    return size ? { template: { type: "radius", size, stationary: true }, range: null } : null;
  }

  get triggerName(): string {
    const trigger = this.trigger;
    if (trigger?.save) return "Ongoing Save";
    return (trigger?.damageParts.length ?? 0) > 0 ? "Ongoing Damage" : "Ongoing Effect";
  }

  get effectId(): string {
    return utils.namedIDStub(`zone ${this.name}`, { prefix: "ddb", postfix: "ef" });
  }

  get behaviors(): I5eActivityBehavior[] {
    const trigger = this.trigger;
    const excludeSelf = (trigger?.excludeSelf ?? false) || this.movesWithMonster
      || (/\bthat isn't an? \w|\bother than\b/i).test(this.text);
    return [
      ...(this.isTerrain ? [DDBEnricherData.BehaviorHelper.difficultTerrain({ types: this.terrain })] : []),
      ...(trigger
        ? [DDBEnricherData.BehaviorHelper.activity({
          events: trigger.events,
          ...(this.triggerNeedsSibling ? { activityName: this.triggerName } : {}),
          ...(excludeSelf ? { excludeSelf: true } : {}),
        })]
        : []),
      ...(this.movementSentence
        ? [DDBEnricherData.BehaviorHelper.activity({
          events: MOVEMENT_EVENTS,
          oncePerTurn: false,
          ...(this.movementNeedsSibling ? { activityName: MOVEMENT_DAMAGE } : {}),
          ...(excludeSelf ? { excludeSelf: true } : {}),
        })]
        : []),
    ];
  }

  override get type(): IDDBActivityType | null {
    return this.isZone && this.hasNoParsedActivity ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData {
    if (!this.isZone) return {};
    const target = this.target;
    return {
      ...(this.hasNoParsedActivity ? { name: this.name, activationType: "special" } : {}),
      ...(target ? { targetType: "creature" } : {}),
      data: {
        ...(target
          ? {
            target: {
              override: true,
              affects: { type: "creature" },
              template: { count: "1", contiguous: false, units: "ft", ...target.template },
            },
            ...(target.range ? { range: { override: true, value: target.range, units: "ft" } } : {}),
          }
          : {}),
        behaviors: this.behaviors,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.isZone) return [];
    const siblings: IDDBAdditionalActivity[] = [];
    const trigger = this.trigger;
    if (trigger && this.triggerNeedsSibling) {
      const when = [
        trigger.events.includes("tokenEnter") ? "enters the area" : null,
        trigger.events.includes("tokenTurnStart") ? "starts its turn there" : null,
        trigger.events.includes("tokenTurnEnd") ? "ends its turn there" : null,
      ].filter((phrase) => phrase !== null);
      const fired = regionTrigger(this.triggerName, {
        condition: `A creature ${when.join(" or ")}`,
        ...(trigger.save ? { save: trigger.save, onSave: trigger.onSave } : {}),
        damageParts: trigger.damageParts,
      });
      // An activity with no effect links of its own picks up every unmatched effect the parser
      // made for the action. Linking its own effect here makes the linker leave it alone; one
      // with nothing to apply opts out instead.
      if (trigger.status) {
        foundry.utils.setProperty(fired, "overrides.data.effects", [{
          _id: this.effectId,
          level: { min: null, max: null },
          riders: { activity: [], effect: [], item: [] },
        }]);
      } else {
        foundry.utils.setProperty(fired, "overrides.noeffect", true);
      }
      siblings.push(fired);
    }
    if (this.movementNeedsSibling && this.movementSentence) {
      const moved = regionTrigger(MOVEMENT_DAMAGE, {
        condition: "Moves into or within the area (rolled for every 5 feet moved)",
        damageParts: DDBDescriptions.parseDamageParts(this.movementSentence).parts,
      });
      foundry.utils.setProperty(moved, "overrides.noeffect", true);
      siblings.push(moved);
    }
    return siblings;
  }

  override get effects(): IDDBEffectHint[] {
    const trigger = this.trigger;
    if (!this.isZone || !trigger?.status || !this.triggerNeedsSibling) return [];
    return [{
      name: `${this.name}: ${trigger.status}`,
      activityMatch: this.triggerName,
      statuses: [trigger.status] as IDDBEffectHint["statuses"],
      data: { _id: this.effectId },
      options: {
        transfer: false,
        ...(trigger.expiry ? { expiry: trigger.expiry, durationSeconds: null } : {}),
      },
    }];
  }

  // a sibling sits beside the saves the parser builds from the same text, not instead of them
  override get keepParsedActivities(): boolean {
    return this.isZone && (this.triggerNeedsSibling || this.movementNeedsSibling);
  }

}
