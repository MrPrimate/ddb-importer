import DDBEnricherData from "../../data/DDBEnricherData";
import { linkMonsterSummons, monsterSummon, monsterSummonData } from "../_MonsterSummons";
import utils from "../../../../lib/Utils";
import { monsterLinksToResidue, parseSummon } from "./_SummonText";

type TSummon = NonNullable<ReturnType<typeof parseSummon>>;

interface IParsedAction {
  strippedHtml?: string;
  html?: string;
  isSave?: boolean;
  isAttack?: boolean;
  type?: string;
  actionData?: { damageParts?: unknown[]; healingParts?: unknown[] };
  ddbMonster?: { name?: string };
}

const PLACE = "Summon Creatures";

/**
 * Monster features that bring other stat blocks onto the map: a devil's Summon Devil, a vampire's
 * Children of the Night, a necromancer's Summon Undead. The parser makes these a bare utility (or
 * the save or attack the feature also has), with nothing for the creatures. This reads the
 * creatures, their counts, the range and how long they stay from the text and adds a summon whose
 * profiles are linked to the monster compendium afterwards.
 *
 * Where the feature does nothing else, the summon IS its activity, so it spends the feature's
 * uses. It sits beside the parsed activity instead when that activity has something to roll: a
 * save or attack the feature also makes, or the d100 of a summoning that can fail ("a 30 percent
 * chance"), which is rolled first and spends the use whether or not anything answers.
 *
 * Many of these names are shared ("Summon Demon" covers a score of different lists), and a few
 * name something that is no stat block at all, so text that yields no creature changes nothing.
 */
export default class SummonCreatures extends DDBEnricherData {

  get parser(): IParsedAction {
    return (this.ddbParser ?? {}) as IParsedAction;
  }

  /** The raw text with any monster links rewritten to the residue form, and the ids those links gave. */
  get linked(): { text: string; ids: Map<string, number> } {
    const raw = this.parser.html;
    if (!raw) return { text: (this.parser.strippedHtml ?? "").trim(), ids: new Map() };
    const { html, ids } = monsterLinksToResidue(raw);
    return { text: utils.stripHtml(html).trim(), ids };
  }

  /** The feature's text without its own title, which often holds "Summon" and "a Short or Long Rest". */
  get text(): string {
    const text = this.linked.text;
    const title = (/^[^.]{1,90}?\.\s/).exec(text);
    return title && text.startsWith(this.name.split("(")[0].trim()) ? text.slice(title[0].length) : text;
  }

  get summon(): TSummon | null {
    return parseSummon(this.text, this.parser.ddbMonster?.name ?? "");
  }

  get creatures(): { name: string; count: string; label?: string; ddbId?: number }[] {
    const ids = this.linked.ids;
    return (this.summon?.creatures ?? []).map((creature) => ({
      name: creature.name,
      count: creature.count,
      ...(ids.has(creature.name.toLowerCase()) ? { ddbId: ids.get(creature.name.toLowerCase()) } : {}),
      ...(creature.upTo ? { label: `${creature.name} (up to ${creature.count})` } : {}),
    }));
  }

  /** The parsed activity has a roll of its own that the summon must not replace. */
  get hasParsedRoll(): boolean {
    const data = this.parser.actionData;
    return Boolean(this.parser.isSave || this.parser.isAttack)
      || (data?.damageParts ?? []).length > 0
      || (data?.healingParts ?? []).length > 0;
  }

  get isBeside(): boolean {
    return this.hasParsedRoll || Boolean(this.summon?.chance);
  }

  get condition(): string {
    const summon = this.summon;
    return [
      summon?.chance ? `Succeeds on ${summon.chance} or lower on the d100` : null,
      summon?.delay ? `Arrive in ${summon.delay} rounds` : null,
    ].filter((part) => part !== null).join("; ");
  }

  override get type(): IDDBActivityType | null {
    if (!this.summon) return null;
    return this.isBeside ? null : DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    const summon = this.summon;
    if (!summon) return {};
    if (summon.chance && !this.hasParsedRoll) {
      return {
        name: "Summoning Chance",
        // the parser reads "within 60 feet of its summoner" as a 60-foot area to place
        noTemplate: true,
        activationCondition: `${summon.chance} percent chance of success`,
        data: { roll: { prompt: false, visible: true, name: "Summoning Chance", formula: "1d100" } },
      };
    }
    if (this.isBeside) return {};
    return {
      noTemplate: true,
      noeffect: true,
      ...(this.condition ? { activationCondition: this.condition } : {}),
      data: {
        ...monsterSummonData({ creatures: this.creatures, challenge: summon.challenge }),
        ...(summon.range ? { range: { override: true, value: summon.range, units: "ft" } } : {}),
        ...(summon.duration ? { duration: { override: true, ...summon.duration } } : {}),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const summon = this.summon;
    if (!summon || !this.isBeside) return [];
    return [
      monsterSummon(PLACE, {
        creatures: this.creatures,
        challenge: summon.challenge,
        // the parsed activity beside it has already taken the action and the use
        activationType: "special",
        activationCondition: this.condition,
        ...(summon.range ? { range: summon.range } : {}),
        ...(summon.duration ? { duration: summon.duration } : {}),
      }),
    ];
  }

  override get keepParsedActivities(): boolean {
    return Boolean(this.summon) && this.isBeside;
  }

  override async cleanup(): Promise<void> {
    await linkMonsterSummons(this.data, this.creatures, this.is2024);
  }

}
