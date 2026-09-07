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
          disabled: true,
          description: "Enable this effect while the creature is in matching terrain. AC5e cannot detect terrain.",
        },
        name: this.name,
        ac5eOnly: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "skill.ste",
            20,
            "flags.automated-conditions-5e.skill.advantage",
          ),
        ],
      },
    ];
  }

}
