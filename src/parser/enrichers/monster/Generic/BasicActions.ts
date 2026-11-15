import { ACTOR } from "../../../../config/dictionary/actor/actor";
import utils from "../../../../lib/Utils";
import { parseTags } from "../../../lib/DDBReferenceLinker";
import DDBEnricherData from "../../data/DDBEnricherData";
import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** One standard action (CONFIG.DDB.basicActions) a monster feature lets it take. */
interface IBasicActionOffer {
  name: string;
  /** Whether the offer is in the feature's opening sentence, i.e. it is what the feature does. */
  opening: boolean;
  activationType: TActivationCost;
  /** Present for the actions that are an ability check (Hide, Search, Study, Influence). */
  check: I5eActivityCheck | null;
}

/** The effect an action leaves on the monster, keyed by action name. */
interface IActionEffect {
  name: string;
  status?: string;
  /** The dnd5e effects compendium entry for it, which dnd5e 6.1 added. */
  srdKey?: "dashing" | "disengaged" | "dodging";
  /** dnd5e 6.1's action artwork for the compendium effect. */
  srdImg?: string;
  /** Artwork every supported dnd5e ships, for the effect built here before 6.1. */
  img?: string;
  expiry?: T5eEffectExpiry;
}

/**
 * Dash and Disengage last until the end of the turn and Dodge until the start of the monster's
 * next turn, as dnd5e 6.1's Dashing, Disengaged and Dodging effects do. The dodging status carries
 * the rules (Dexterity save advantage in dnd5e; AC5e also gives attackers Disadvantage).
 */
const ACTION_EFFECTS: Record<string, IActionEffect> = {
  Dash: {
    name: "Dashing",
    srdKey: "dashing",
    srdImg: "systems/dnd5e/icons/svg/action/dash.svg",
    img: "systems/dnd5e/icons/svg/action/dash.svg",
    expiry: "turnEnd",
  },
  Disengage: {
    name: "Disengaged",
    srdKey: "disengaged",
    srdImg: "systems/dnd5e/icons/svg/action/disengage.svg",
    expiry: "turnEnd",
  },
  Dodge: {
    name: "Dodging",
    status: "dodging",
    srdKey: "dodging",
    srdImg: "systems/dnd5e/icons/svg/action/dodge.svg",
    img: "systems/dnd5e/icons/svg/statuses/dodging.svg",
    expiry: "sourceStart",
  },
  Hide: { name: "Hiding", status: "hiding", img: "systems/dnd5e/icons/svg/statuses/hiding.svg" },
};

/** Activation types that mean the feature is not something the monster spends an action on. */
const PASSIVE_ACTIVATIONS = ["", "special", "none", "villain"];

/**
 * Monster features that let the creature take one or more of the standard actions, usually as a
 * Bonus Action: Nimble Escape, Cunning Action, Shadow Stealth, Skitter and their many renamings.
 * Like the SRD Goblin's Nimble Escape, each offered action becomes an activity of its own: an
 * ability check for an action that is one (Hide rolls Stealth) and a utility for the rest.
 *
 * It is matched on the feature's text rather than its name (DDBMonsterFeatureEnricher's text
 * fallback), so only features with no named enricher reach it. A named enricher whose feature
 * also offers an action (Teleport's Hidden Step) adds them through the static helpers.
 */
export default class BasicActions extends _MonsterFeatureSupport {

  /**
   * The standard actions a monster can be offered. The 2024 action table entries open with an
   * italic summary; the other rules entries (Opportunity Attack, Grapple, Two-Weapon Fighting) do
   * not. Attack and Magic are left out: features naming them are about attacking or casting.
   */
  static actions(): IDDBConfigBasicAction[] {
    return (CONFIG.DDB?.basicActions ?? []).filter((action) =>
      action.description?.startsWith("<p><em>") && !["Attack", "Magic"].includes(action.name));
  }

  static #offerRegex(names: string[]): RegExp {
    const alt = names.map((name) => utils.regexSanitizeString(name)).join("|");
    const list = `(?:${alt})(?:\\s*,\\s*(?:or\\s+)?(?:the\\s+)?(?:${alt})|\\s+or\\s+(?:the\\s+)?(?:${alt}))*`;
    return new RegExp(`\\b(?:either\\s+)?takes?\\s+(?:either\\s+)?the\\s+(${list})\\s+action\\b`, "gi");
  }

  /** Words before the offer, anywhere in its sentence, that make it someone else's or a prohibition. */
  static #SENTENCE_REJECT = /\b(?:must|cannot|\w+n't|not|targets?|creatures?|ally|allies|another|enemies|nothing)\b/i;

  /** A condition in the offer's own clause that makes it a rule about the action, not an offer of it. */
  static #CLAUSE_REJECT = /\b(?:if|when|whenever|unless|until)\b/i;

  /**
   * The offer's own clause must read as "<subject> [can|may] [use a bonus action to] take the X
   * action", so a trait that only mentions an action (Iguanodon's Bipedal Shift, Multitudinous) is
   * left alone.
   */
  static #CLAUSE_GRAMMAR = new RegExp([
    "^(?:\\w+:\\s*)?",
    "(?:(?:and|then|or)\\s+)?",
    "(?:[\\w' ()-]{1,60}?\\s+)?",
    "(?:(?:and|then|or)\\s+)?",
    "(?:(?:can|may)\\s+(?:then\\s+)?)?",
    "(?:(?:use|spend)\\s+(?:a|an|its|her|his|their)\\s+bonus\\s+action\\s+(?:on\\s+each\\s+of\\s+\\w+\\s+turns?\\s+)?to\\s+)?",
    "(?:either\\s+)?$",
  ].join(""), "i");

  /**
   * The activation an offer takes: the Bonus Action or Reaction its own sentence spends (a 2014
   * Duergar's Reduce is an action, the Hide it allows a bonus action), else the feature's. Null
   * for a passive trait.
   */
  static #activationFor(sentence: string, featureActivation: string | undefined): TActivationCost | null {
    if ((/\bbonus action\b/i).test(sentence)) return "bonus";
    if ((/\breaction\b/i).test(sentence)) return "reaction";
    if (!PASSIVE_ACTIVATIONS.includes(featureActivation ?? "")) return featureActivation as TActivationCost;
    return null;
  }

  /**
   * The standard actions the text lets the monster take, in text order, with the activation each
   * takes. `featureActivation` is the parser's activation type, or the feature's section while the
   * parser has yet to resolve one.
   */
  static offeredActions(text: string, featureActivation?: string): Omit<IBasicActionOffer, "check">[] {
    const actions = BasicActions.actions();
    if (actions.length === 0) return [];
    const names = actions.map((action) => action.name);
    const found: Omit<IBasicActionOffer, "check">[] = [];
    for (const match of text.matchAll(BasicActions.#offerRegex(names))) {
      const before = text.slice(0, match.index);
      const sentenceStart = Math.max(...[".", "!", "?"].map((mark) => before.lastIndexOf(mark))) + 1;
      const clauseStart = Math.max(...[".", "!", "?", ",", ";", ":"].map((mark) => before.lastIndexOf(mark))) + 1;
      const prefix = before.slice(sentenceStart);
      const clause = before.slice(clauseStart).trim();
      if (BasicActions.#SENTENCE_REJECT.test(prefix) || BasicActions.#CLAUSE_REJECT.test(clause)) continue;
      if (!BasicActions.#CLAUSE_GRAMMAR.test(clause ? `${clause} ` : "")) continue;

      const after = text.slice(match.index + match[0].length);
      const sentenceEnd = after.search(/[.!?](?:\s|$)/);
      const sentence = `${prefix}${match[0]}${sentenceEnd >= 0 ? after.slice(0, sentenceEnd) : after}`;
      const activationType = BasicActions.#activationFor(sentence, featureActivation);
      if (!activationType) continue;
      const opening = before.slice(0, sentenceStart).trim() === "";

      const listed = match[1].toLowerCase();
      const ordered = names.filter((name) => new RegExp(`\\b${utils.regexSanitizeString(name)}\\b`, "i").test(listed))
        .sort((a, b) => listed.indexOf(a.toLowerCase()) - listed.indexOf(b.toLowerCase()));
      for (const name of ordered) {
        if (!found.some((offer) => offer.name === name)) found.push({ name, opening, activationType });
      }
    }
    return found;
  }

  /** The names of the standard actions the text lets the monster take. */
  static offeredActionNames(text: string, featureActivation?: string): string[] {
    return BasicActions.offeredActions(text, featureActivation).map((offer) => offer.name);
  }

  /**
   * Whether a monster feature is one this enricher handles: it offers a standard action the
   * monster spends an action, Bonus Action, Reaction or legendary action on. Multiattack's
   * trailing "It can then take the Dash action" stays with Multiattack.
   */
  static matches(name: string, text: string, featureActivation?: string): boolean {
    if ((/^Multiattack\b/i).test(name)) return false;
    return BasicActions.offeredActions(text, featureActivation).length > 0;
  }

  /**
   * The check an action makes, read from its rules summary ("Make a Wisdom (Insight, Medicine,
   * Perception, or Survival) check."). Influence offers skills of two abilities, so it leaves the
   * ability to each skill's default. The Hide DC is a 2024 rule; 2014 hiding is contested.
   */
  static #actionCheck(action: IDDBConfigBasicAction, is2014: boolean): I5eActivityCheck | null {
    const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
    const summary = plain(action.description.split("<hr>")[0] ?? "");
    const make = summary.match(/Make an? (.+?) check/i);
    if (!make) return null;
    const groups = [...make[1].matchAll(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*\(([^)]+)\)/gi)];
    if (groups.length === 0) return null;
    const associated = groups.flatMap((group) => group[2].split(/,\s*(?:or\s+)?|\s+or\s+/)
      .map((label) => ACTOR.skills.find((skill) => skill.label.toLowerCase() === label.trim().toLowerCase())?.name)
      .filter((skill): skill is T5eSkillKey => !!skill));
    const dc = is2014 ? null : plain(action.description).match(/\bDC (\d+) \w+ \(\w+\) check/i)?.[1];
    return {
      ability: groups.length === 1 ? groups[0][1].slice(0, 3).toLowerCase() : "",
      associated,
      dc: { calculation: "", formula: dc ?? "" },
    } as I5eActivityCheck;
  }

  /**
   * The standard actions a monster feature offers, with their checks. Empty for Multiattack and
   * for a legendary or villain block summary, which quotes the options listed under it.
   */
  static offersFor(enricher: _MonsterFeatureSupport): IBasicActionOffer[] {
    const parser = enricher.parser;
    if ((/^Multiattack\b/i).test(enricher.name ?? "") || parser.isBlockSummary) return [];
    const actions = BasicActions.actions();
    // the parser's activation, or the feature's section before the parser has resolved one
    const featureActivation = parser.actionData?.activation?.type ?? parser.type;
    return BasicActions.offeredActions(enricher.text, featureActivation).map((offer) => ({
      ...offer,
      check: BasicActions.#actionCheck(actions.find((entry) => entry.name === offer.name)!, enricher.is2014 ?? false),
    }));
  }

  /**
   * One activity per offer. `partOf` names a feature whose opening sentence already spends the
   * action (Hidden Step teleports "and takes the Hide action"): its opening offers are a free
   * follow-up to that activity rather than another use.
   */
  static offerActivities(
    enricher: _MonsterFeatureSupport, offers: IBasicActionOffer[], { partOf = null }: { partOf?: string | null } = {},
  ): IDDBAdditionalActivity[] {
    const featureActivation = enricher.parser.actionData?.activation ?? {};
    return offers.map((offer) => {
      const followUp = !!partOf && offer.opening;
      const activation = followUp
        ? { type: "special", value: null, condition: `As part of ${partOf}.` }
        : { ...foundry.utils.deepClone(featureActivation), type: offer.activationType };
      return {
        init: {
          name: offer.name,
          id: utils.namedIDStub(offer.name, { prefix: "ddbBasic" }),
          type: offer.check ? DDBEnricherData.ACTIVITY_TYPES.CHECK : DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          activationOverride: activation as I5eActivityActivation,
          // an option of the feature itself spends its use, recharge or legendary action cost; an
          // action it allows afterwards (Hide while Reduced) or as part of another activity does not
          generateConsumption: offer.opening && !followUp,
          generateDamage: false,
          generateSave: false,
          generateAttack: false,
          generateCheck: !!offer.check,
          checkOverride: offer.check,
          generateTarget: true,
          targetOverride: _MonsterFeatureSupport.targetWith({ type: "self", count: "" }),
          generateRange: true,
          rangeOverride: { value: null, units: "self", special: "" } as I5eActivityRange,
          includeBaseDamage: false,
        },
      };
    });
  }

  /** The rules text of a standard action from CONFIG.DDB.basicActions, with its rule tags linked. */
  static actionDescription(name: string): string {
    const description = BasicActions.actions().find((action) => action.name === name)?.description ?? "";
    return description ? parseTags(description) : "";
  }

  /**
   * The effects the offered actions leave on the monster, each applied by its own activity. On
   * dnd5e 6.1+ Dash, Disengage and Dodge copy the system's compendium effects (name, artwork,
   * status, expiry); before that, and for Hiding, the effect is built here and carries the
   * action's rules text as its description.
   */
  static offerEffects(offers: IBasicActionOffer[]): IDDBEffectHint[] {
    return offers.filter((offer) => ACTION_EFFECTS[offer.name]).map((offer) => {
      const effect = ACTION_EFFECTS[offer.name];
      const srdUuid = effect.srdKey ? DDBEnricherData.SRDEffects.optionalUuid("conditions", effect.srdKey) : null;
      const img = srdUuid ? effect.srdImg : effect.img;
      const description = srdUuid ? "" : BasicActions.actionDescription(offer.name);
      return {
        name: effect.name,
        ...(img ? { img } : {}),
        ...(effect.status ? { statuses: [effect.status] as IDDBEffectHint["statuses"] } : {}),
        activityMatch: offer.name,
        options: {
          durationSeconds: null,
          ...(effect.expiry ? { expiry: effect.expiry } : {}),
          ...(description ? { description } : {}),
        },
        ...(srdUuid ? { data: { _stats: { compendiumSource: srdUuid } } as unknown as I5eEffectData } : {}),
      };
    });
  }

  get offers(): IBasicActionOffer[] {
    return BasicActions.offersFor(this);
  }

  /**
   * Attacks, saves, damage and healing keep the parser's activity, with the actions beside it
   * (Bandit Fighting's trip, Assassin's Agility's attack). A plain utility is just the offer when
   * the feature opens with it, so the first action takes its place; a feature that does something
   * else first (Reduce) keeps its utility and gains the actions after it.
   */
  get #replacesPrimary(): boolean {
    const parser = this.parser;
    if (parser.isAttack || parser.isSave || parser.healingAction) return false;
    if ((parser.actionData?.damageParts ?? []).length > 0) return false;
    if ((parser.actionData?.healingParts ?? []).length > 0) return false;
    return this.offers[0]?.opening ?? false;
  }

  override get type(): IDDBActivityType | null {
    const first = this.offers[0];
    if (!first || !this.#replacesPrimary) return null;
    return first.check ? DDBEnricherData.ACTIVITY_TYPES.CHECK : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    const first = this.offers[0];
    if (!first || !this.#replacesPrimary) return null;
    return {
      name: first.name,
      targetSelf: true,
      rangeSelf: true,
      noTemplate: true,
      ...(first.check ? { data: { check: first.check } } : {}),
      // a trait's "special" activation becomes the Bonus Action its text spends
      ...(first.activationType !== this.parser.actionData?.activation?.type ? { activationType: first.activationType } : {}),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const offers = this.#replacesPrimary ? this.offers.slice(1) : this.offers;
    return BasicActions.offerActivities(this, offers);
  }

  override get effects(): IDDBEffectHint[] {
    return BasicActions.offerEffects(this.offers);
  }

}
