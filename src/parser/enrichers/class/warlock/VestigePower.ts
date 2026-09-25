import DDBEnricherData from "../../data/DDBEnricherData";

const RESISTANCES = [
  { option: "Celestial Resistance", type: "Radiant" },
  { option: "Fiend Resistance", type: "Fire" },
  { option: "Undead Resistance", type: "Necrotic" },
];

/** Vestige Patron level 6: the warlock shares the vestige's resistance while within 30 feet. */
export default class VestigePower extends DDBEnricherData {

  override get noChoiceBuild(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const chosen = this.ddbParser.isMuncher
      ? ""
      : (this.ddbParser._chosen?.map((a) => a.label).join("|") ?? "");
    return RESISTANCES.map(({ option, type }) => ({
      name: `Vestige Power: ${type} Resistance`,
      options: {
        transfer: true,
        disabled: !chosen.includes(option),
        description: "While within 30 feet of your Vestige Companion.",
      },
      changes: [DDBEnricherData.ChangeHelper.damageResistanceChange(type)],
    }));
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
