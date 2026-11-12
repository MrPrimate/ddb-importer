import DDBEnricherData from "../data/DDBEnricherData";
import { ACTIVE_CONSUMABLE_OVERRIDE, activeConsumableDrink, activeConsumableEffects } from "./_ActiveConsumable";
import utils from "../../../lib/Utils";

/**
 * Troll's Blood Elixir (World of Warcraft, every size): drinking heals a flat amount, and the same
 * amount again at the start of each of your turns for 1 minute while you have at least 1 Hit Point.
 *
 * Drinking is a self-enchantment lasting that minute (see _ActiveConsumable). An enchant activity
 * cannot heal, so its rider is the Regenerate heal, used straight after drinking and at the start of
 * each turn, and only on the sheet while the elixir lasts. With Midi-QOL the drinker's rider effect
 * also heals at each turn start (OverTime), so Regenerate is then only needed for the first heal.
 */
export default class TrollsBloodElixir extends DDBEnricherData {

  static HEAL_ID = utils.namedIDStub("Regenerate", { prefix: "ddbItem" });

  static EFFECT_ID = "ddbTrollsBloodEf";

  // the sizes heal 2, 4, 6 and 8
  get amount(): string {
    const name = this.data.name;
    if (name.includes("(Supreme)")) return "8";
    if (name.includes("(Superior)")) return "6";
    if (name.includes("(Greater)")) return "4";
    return "2";
  }

  // the "Troll's Blood Elixirs" catalog entry is not a potion
  get isCatalog(): boolean {
    return this.data.name.endsWith("Elixirs");
  }

  override get type(): IDDBActivityType | null {
    return this.isCatalog ? null : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get addAutoAdditionalActivities(): boolean {
    return this.isCatalog;
  }

  override get activity(): IDDBActivityData | null {
    if (this.isCatalog) return null;
    return activeConsumableDrink({
      activationType: "bonus",
      duration: { value: "1", units: "minute" },
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isCatalog) return [];
    const midi = DDBEnricherData.AutoEffects.effectModules().midiQolInstalled;
    return [
      {
        init: { name: "Regenerate", type: DDBEnricherData.ACTIVITY_TYPES.HEAL, id: TrollsBloodElixir.HEAL_ID },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: midi
              ? "When you drink the elixir; Midi-QOL heals you again at the start of each of your turns"
              : "When you drink the elixir, and at the start of each of your turns while it lasts, if you have at least 1 Hit Point",
          },
          targetOverride: { override: true, affects: { type: "self" } },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: this.amount, types: ["healing"] }),
        },
        overrides: { noConsumeTargets: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isCatalog) return [];
    return activeConsumableEffects({
      name: "Troll's Blood Elixir",
      endName: "End Troll's Blood",
      effectId: TrollsBloodElixir.EFFECT_ID,
      description: `You regain ${this.amount} Hit Points at the start of each of your turns until the elixir ends after 1 minute, provided you have at least 1 Hit Point.`,
      activityRiders: [TrollsBloodElixir.HEAL_ID],
      riderEffect: {
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Troll's Blood Elixir (Start of Turn Regeneration),turn=start,savingThrow=false,damageRoll=${this.amount},damageType=healing,condition=@attributes.hp.value > 0,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    });
  }

  override get override(): IDDBOverrideData | null {
    if (this.isCatalog) return null;
    return ACTIVE_CONSUMABLE_OVERRIDE;
  }

}
