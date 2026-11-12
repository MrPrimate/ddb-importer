import DDBEnricherData from "../../data/DDBEnricherData";
import Lineage from "../generic/Lineage";

type TTaurenLineage = "Mulgore Tauren" | "Highmountain Tauren" | "Taunka";

const LINEAGES: TTaurenLineage[] = ["Mulgore Tauren", "Highmountain Tauren", "Taunka"];

const SAVE_ABILITIES = [
  { key: "str", label: "Strength" },
  { key: "con", label: "Constitution" },
  { key: "wis", label: "Wisdom" },
];

/**
 * Tauren Lineage (World of Warcraft). Mulgore Tauren replaces an attack with a war stomp (a Con save
 * in a 5-foot Emanation or Stunned until the end of your turn), Highmountain Tauren charges (a Str
 * save for each creature whose space you enter, Prone and PB + Str mod Bludgeoning), and Taunka
 * gains +1 AC and Cold Resistance. The text names Prone for the whole table, so the parsed status
 * effect is dropped. The DC uses the ability picked in Tauren Lineage Saving Throw; with no pick
 * (the muncher) each save is offered once per candidate ability.
 */
export default class TaurenLineage extends Lineage {

  get lineages(): TTaurenLineage[] {
    const names = [
      ...(this.ddbParser._chosen ?? []).map((choice) => choice.label),
      this.data.name,
    ].map((name) => (name ?? "").trim());
    const chosen = LINEAGES.filter((lineage) => names.some((name) => name === lineage || name.endsWith(`: ${lineage}`)));
    return chosen.length > 0 ? chosen : LINEAGES;
  }

  /** The DC ability picked on the character's sibling Tauren Lineage Saving Throw choice. */
  get saveAbilities(): string[] {
    const parser = this.ddbParser;
    if (!parser.isMuncher) {
      const options = parser.ddbData?.character?.options?.race ?? [];
      const picked = SAVE_ABILITIES.find((ability) => options.some((option) => option.definition?.name === ability.label));
      if (picked) return [picked.key];
    }
    return SAVE_ABILITIES.map((ability) => ability.key);
  }

  override get clearAutoStatusEffect(): boolean {
    return true;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  /** One activity name per DC ability, suffixed only when several are offered. */
  activityNames(base: string): string[] {
    const abilities = this.saveAbilities;
    return abilities.map((ability) => (abilities.length > 1 ? `${base} (${ability.toUpperCase()} DC)` : base));
  }

  #save({ lineage, ability, multiple }: { lineage: TTaurenLineage; ability: string; multiple: boolean }): IDDBAdditionalActivity {
    const suffix = multiple ? ` (${ability.toUpperCase()} DC)` : "";
    const saveDC = { calculation: ability, formula: "" };
    if (lineage === "Mulgore Tauren") {
      return {
        init: { name: `War Stomp${suffix}`, type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "In place of one attack of the Attack action; not while Prone, flying, climbing or swimming",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature", choice: true },
            template: { contiguous: false, type: "radius", size: "5", units: "ft" },
          },
          rangeOverride: { units: "self" },
          saveOverride: { ability: ["con"], dc: saveDC },
        },
      };
    }
    return {
      init: { name: `Charge${suffix}`, type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
      build: {
        generateActivation: true,
        generateTarget: true,
        generateSave: true,
        generateDamage: true,
        generateConsumption: false,
        activationOverride: {
          type: "action",
          value: 1,
          condition: "Move up to your Speed through other creatures' spaces without provoking Opportunity Attacks",
        },
        targetOverride: { override: true, affects: { type: "creature" } },
        saveOverride: { ability: ["str"], dc: saveDC },
        onSave: "none",
        damageParts: [
          DDBEnricherData.basicDamagePart({ customFormula: "@prof + @abilities.str.mod", types: ["bludgeoning"] }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const abilities = this.saveAbilities;
    const multiple = abilities.length > 1;
    return this.lineages
      .filter((lineage) => lineage !== "Taunka")
      .flatMap((lineage) => abilities.map((ability) => this.#save({ lineage, ability, multiple })));
  }

  override get effects(): IDDBEffectHint[] {
    const lineages = this.lineages;
    const effects: IDDBEffectHint[] = [];
    if (lineages.includes("Mulgore Tauren")) {
      effects.push({
        name: "War Stomp: Stunned",
        statuses: ["Stunned"],
        activitiesMatch: this.activityNames("War Stomp"),
        options: {
          transfer: false,
          expiry: "turnEnd",
          description: "Stunned until the end of the tauren's current turn.",
        },
      });
    }
    if (lineages.includes("Highmountain Tauren")) {
      effects.push({
        name: "Charge: Prone",
        statuses: ["Prone"],
        activitiesMatch: this.activityNames("Charge"),
        options: {
          transfer: false,
        },
      });
    }
    if (lineages.length === 1 && lineages[0] === "Taunka") {
      effects.push({
        name: "Taunka",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
        ],
      });
    }
    return effects;
  }

}
