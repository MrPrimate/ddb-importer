/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class RayOfEnfeeblement extends DDBEnricherData {

  get type() {
    return this.is2014 ? "attack" : "save";
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Enfeebled",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
        },
      },
    ];
  }

  get effects() {
    if (this.is2014) {
      return [
        {
          name: "Enfeebled",
          activityMatch: "Cast",
          options: {
            description: this.ddbParser?.ddbDefinition?.description ?? "",
          },
          midiChanges: [
            DDBEnricherData.ChangeHelper.overrideChange(
              `label=${this.data.name} (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true`,
              20,
              "flags.midi-qol.OverTime",
            ),
          ],
          // macro needs updating to activities based damaged halfing
          // macroChanges: [
          //   { macroType: "spell", macroName: "rayofEnfeeblement.js" },
          // ],
        },
      ];
    } else {
      return [
        {
          name: "Briefly Enfeebled",
          activityMatch: "Cast",
          options: {
            durationSeconds: 6,
            description: this.ddbParser?.ddbDefinition?.description ?? "",
          },
          daeSpecialDurations: ["1Attack"],
        },
        {
          name: "Enfeebled",
          activityMatch: "Cast",
          options: {
            durationSeconds: 60,
            description: this.ddbParser?.ddbDefinition?.description ?? "",
          },
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("-1d8", 20, "system.bonuses.mwak.damage"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("-1d8", 20, "system.bonuses.rwak.damage"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("-1d8", 20, "system.bonuses.msak.damage"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("-1d8", 20, "system.bonuses.rsak.damage"),
          ],
          midiChanges: [
            DDBEnricherData.ChangeHelper.overrideChange(
              `label=${this.data.name} (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true`,
              20,
              "flags.midi-qol.OverTime",
            ),
          ],
        },
      ];
    }

  }

  // macro needs updating to activities based damaged halfing
  // get itemMacro() {
  //   if (this.is2014) {
  //     return {
  //       type: "spell",
  //       name: "rayofEnfeeblement.js",
  //     };
  //   }
  //   return null;
  // }

}
