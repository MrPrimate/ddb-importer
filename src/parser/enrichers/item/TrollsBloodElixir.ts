import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Troll's Blood Elixir (World of Warcraft, every size): drinking heals a flat amount, and the same
 * amount again at the start of each of your turns for 1 minute while you have at least 1 Hit Point.
 *
 * The potion keeps dnd5e's auto destroy, so a stack drops one per drink and the last drink deletes
 * the item. The drink applies a 1 minute effect to the drinker, which outlives the deleted item:
 * with Midi-QOL it heals each turn (OverTime); without it, the item's Start of Turn activity is the
 * repeat heal while any of the stack is left, and the effect tracks the minute after the last one.
 */
export default class TrollsBloodElixir extends DDBEnricherData {

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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isCatalog || DDBEnricherData.AutoEffects.effectModules().midiQolInstalled) return [];
    return [
      {
        init: { name: "Start of Turn", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          noeffect: true,
          activationOverride: { type: "turnStart", value: 1, condition: "For 1 minute after drinking, while you have at least 1 Hit Point" },
          targetOverride: { override: true, affects: { type: "self" } },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: this.amount, types: ["healing"] }),
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isCatalog) return [];
    return [
      {
        name: "Troll's Blood Elixir",
        options: {
          transfer: false,
          durationSeconds: 60,
          description: `You regain ${this.amount} Hit Points at the start of each of your turns for 1 minute, provided you have at least 1 Hit Point.`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Troll's Blood Elixir (Start of Turn Regeneration),turn=start,savingThrow=false,damageRoll=${this.amount},damageType=healing,condition=@attributes.hp.value > 0,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
