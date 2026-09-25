import DDBEnricherData from "../../data/DDBEnricherData";

export default class Camouflage extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // matched via the "Camouflage" includes hint; the terrain variants all end
    // with the word, unlike e.g. "Camouflaged Webs" which is not a Stealth trait
    if (!this.name.split("(")[0].trim().endsWith("Camouflage")) return [];
    return [
      {
        options: {
          transfer: true,
          // the terrain restriction cannot be detected, so this ships as a toggle
          disabled: true,
          description: "Advantage on Dexterity (Stealth) checks. Enable this effect while the creature is in matching terrain; the terrain is not detected automatically.",
        },
        name: this.name,
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("ste"),
        ],
      },
    ];
  }

}
