import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import utils from "../../../lib/Utils";
import {
  itemText,
  noExtraAttackDamage,
  unrestrictedDamageFormulas,
  weaponDamageBonus,
  weaponDamageEnchantment,
} from "./_ItemActivities";

/**
 * Whelm: a thrown warhammer (20/60 feet in 2014, 60/180 in 2024) that DDB ships without the Thrown
 * property. A ranged attack roll with it deals an extra 1d8 (bludgeoning in 2014, force in 2024),
 * or more against particular creatures. The 1d8 is a damage rule on an enchantment gated on a
 * ranged attack, so a melee hit does not roll it. The 2024 record's larger die against a Construct,
 * an Elemental or a Giant is DDB's "Restriction:" attack; the 2014 record carries no damage modifiers,
 * so both its dice come from the text and its 2d8 against a giant is an attack of its own.
 *
 * Shock Wave (an action, once per dawn) is the parser's save, which takes the thrown range and the
 * generic "Save" name; it becomes a 60 foot radius on the point of impact against creatures of
 * your choice, stunning for a minute with a save at the end of each turn (DC 15 in 2014, 20 in 2024).
 */
export default class Whelm extends DDBEnricherData {

  static VERSUS = "Against Giants";

  static SHOCK_WAVE = "Shock Wave";

  /** The Shock Wave save DC from the text. */
  get shockWaveDC(): string {
    return (/DC (\d+) Constitution saving throw or (?:become|have the) stunned/i).exec(itemText(this))?.[1] ?? "15";
  }

  // the Stunned status is rebuilt with Shock Wave's minute
  override get clearAutoStatusEffect(): boolean {
    return true;
  }

  /** "with a normal range of 20 feet and a long range of 60 feet" */
  get thrownRange(): { value: number; long: number } | null {
    const match = (/Thrown property,? with a normal range of (\d+) feet and a long range of (\d+) feet/i).exec(itemText(this));
    return match ? { value: Number(match[1]), long: Number(match[2]) } : null;
  }

  /** "an extra 1d8 bludgeoning damage, or an extra 2d8 bludgeoning damage if the target is a giant" */
  get rangedText(): { dice: string; type: string; versusDice: string; versus: string } | null {
    const match = (/extra (\d+d\d+) (\w+) damage, or an extra (\d+d\d+) \w+ damage if the target is (?:an? )?([^.]+)\./i).exec(itemText(this));
    return match ? { dice: match[1], type: match[2].toLowerCase(), versusDice: match[3], versus: match[4] } : null;
  }

  /** The record has DDB's restricted dice, so the parser builds the larger hit as a "Restriction:" attack. */
  get hasRestrictedDice(): boolean {
    const modifiers = (this.ddbParser as DDBItem | undefined)?.ddbDefinition?.grantedModifiers ?? [];
    return modifiers.some((mod) => mod.type === "damage" && mod.restriction);
  }

  get rangedDice(): string[] {
    const ddb = unrestrictedDamageFormulas(this);
    if (ddb.length > 0) return ddb;
    const text = this.rangedText;
    return text ? [`${text.dice}[${text.type}]`] : [];
  }

  // the parser's save rider (Whelm's Shock Wave, Giant Slayer's prone save) stays beside the
  // attack built here
  override get keepParsedActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return noExtraAttackDamage();
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const text = this.rangedText;
    if (!text || this.hasRestrictedDice) return [];
    const [number, denomination] = text.versusDice.split("d").map(Number);
    const parts = [DDBEnricherData.basicDamagePart({ number, denomination, types: [text.type] })];
    return [
      {
        init: {
          name: Whelm.VERSUS,
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
          id: utils.namedIDStub(Whelm.VERSUS, { prefix: "ddbItem" }),
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          includeBaseDamage: true,
          damageParts: parts,
          activationOverride: { type: "action", value: 1, condition: `A ranged attack roll against ${text.versus}` },
          noeffect: true,
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
          data: { damage: { includeBase: true, parts } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const dc = this.shockWaveDC;
    const stunned: IDDBEffectHint = {
      name: "Shock Wave: Stunned",
      // Shock Wave is the weapon's only save, renamed from the parser's "Save" after linking
      activityTypesMatch: ["save"],
      statuses: ["Stunned"],
      options: {
        transfer: false,
        durationSeconds: 60,
        // lasts the minute unless a save at the end of its turn ends it
        expiry: null,
        description: `Stunned for 1 minute. Repeat the DC ${dc} Constitution saving throw at the end of each turn, ending the effect on a success.`,
      },
      midiChanges: [
        DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=con, saveDC=${dc}, saveRemove=true, label=Shock Wave`, 20, "flags.midi-qol.OverTime"),
      ],
    };
    const dice = this.rangedDice;
    if (dice.length === 0) return [stunned];
    return [
      stunned,
      weaponDamageEnchantment(
        "Whelm: Ranged Strike",
        dice.map((formula) => weaponDamageBonus(this, formula, [
          DDBEnricherData.ChangeHelper.RANGED_ATTACK_FILTER,
          // the larger die against particular creatures replaces the 1d8 rather than adding to it
          {
            o: "NOT",
            v: {
              o: "OR",
              v: [
                { k: "activity.name", o: "startswith", v: "Restriction:" },
                { k: "activity.name", o: "exact", v: Whelm.VERSUS },
              ],
            },
          },
        ])),
        { description: "A ranged attack roll with Whelm deals extra damage on a hit." },
      ),
    ];
  }

  override get override(): IDDBOverrideData {
    const range = this.thrownRange;
    return {
      func: ({ enricher }) => {
        const document = enricher.data;
        if (document.type !== "weapon") return;
        if (range) {
          document.system.properties = utils.addToProperties(document.system.properties, "thr");
          document.system.range = { ...document.system.range, value: range.value, long: range.long, units: "ft" };
        }
        for (const activity of Object.values((document.system.activities ?? {}) as Record<string, I5eActivity>)) {
          if (activity.type !== "save") continue;
          // fresh objects: the parser's activities share activation, range and target objects
          activity.name = Whelm.SHOCK_WAVE;
          activity.activation = { type: "action", value: 1, condition: "Strike the ground with Whelm; once per dawn" } as I5eActivity["activation"];
          activity.range = { override: true, value: null, units: "self", special: "" } as I5eActivity["range"];
          activity.target = {
            override: true,
            template: { count: "1", contiguous: false, type: "radius", size: "60", width: "", height: "", units: "ft" },
            affects: { count: "", type: "creature", choice: true, special: "Creatures of your choice on the ground within 60 feet of the point of impact" },
            prompt: true,
          } as I5eActivity["target"];
        }
      },
    };
  }

}
