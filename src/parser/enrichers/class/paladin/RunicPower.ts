import DDBEnricherData from "../../data/DDBEnricherData";
import { runesFor, type TRune } from "./_Runes";

/**
 * Runic Power (Oath of the Ebon Blade, World of Warcraft Death Knight): right after casting Rune
 * Strike, spend Channel Divinity (Channel Runic Power for the Death Knight) for the inscribed rune's
 * benefit: Blood heals the Necrotic dealt, Frost deals 2d6 Cold to the target and enemies within 10
 * feet of it, Unholy curses the target to subtract 1d6 from its next save.
 */
export default class RunicPower extends DDBEnricherData {

  get runes(): TRune[] {
    return runesFor({
      names: [
        ...(this.ddbParser._chosen ?? []).map((choice) => choice.label),
        this.data.name,
        this.ddbParser.originalName,
      ],
      html: this.ddbParser.ddbDefinition?.description,
      subclassName: this.ddbParser.subKlass,
    });
  }

  get pool(): string {
    return this.hasClassFeature({ featureName: "Channel Runic Power" }) ? "Channel Runic Power" : "Channel Divinity";
  }

  // every option is its own activity, so the feature builds no default one
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  #activity(rune: TRune): IDDBAdditionalActivity {
    const base: IDDBActivityBuild = {
      generateActivation: true,
      generateTarget: true,
      generateConsumption: false,
      activationOverride: { type: "special", value: 1, condition: "Immediately after you cast Rune Strike" },
    };
    const overrides = {
      addItemConsume: true,
      itemConsumeTargetName: this.pool,
    };
    if (rune === "Blood") {
      return {
        init: { name: "Runic Power: Blood", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          ...base,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "Immediately after you cast Rune Strike: regain Hit Points equal to the Necrotic damage it dealt (enter it as the situational bonus)",
          },
          generateHealing: true,
          targetOverride: { override: true, affects: { type: "self" } },
          // dnd5e cannot hand Rune Strike's damage total to another activity, and a fresh roll
          // would ignore upcasting, critical hits and resistance, so the amount is entered
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "0", types: ["healing"] }),
        },
        overrides,
      };
    } else if (rune === "Frost") {
      return {
        init: { name: "Runic Power: Frost", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          ...base,
          generateDamage: true,
          targetOverride: {
            override: true,
            affects: { type: "enemy" },
            template: { contiguous: false, type: "radius", size: "10", units: "ft" },
          },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["cold"] })],
        },
        overrides,
      };
    }
    return {
      init: { name: "Runic Power: Unholy", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
      build: {
        ...base,
        targetOverride: { override: true, affects: { count: "1", type: "creature" } },
      },
      overrides,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.runes.map((rune) => this.#activity(rune));
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.runes.includes("Unholy")) return [];
    return [
      {
        name: "Runic Power: Unholy Curse",
        activityMatch: "Runic Power: Unholy",
        options: {
          transfer: false,
          expiry: "sourceEnd",
          description: "The next time you make a saving throw, subtract 1d6 from the roll, and the curse ends.",
        },
      },
    ];
  }

}
