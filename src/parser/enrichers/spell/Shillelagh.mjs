/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Shillelagh extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get effects() {
    if (this.is2014) {
      return ["Physical", "Spellcasting"].map((type) => {
        const changes = [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange("8", 20, "system.damage.base.denomination"),
        ];
        const spellCastingChanges = type !== "Physical"
          ? [DDBEnricherData.ChangeHelper.overrideChange("spellcasting", 20, "system.ability")]
          : [];

        return {
          name: `Shillelagh (${type})`,
          type: "enchant",
          changes: [...changes, ...spellCastingChanges],
        };
      });
    } else {
      return ["Physical", "Spellcasting"].map((type) => {
        return [
          { level: 1, denomination: 8 },
          { level: 5, denomination: 10 },
          { level: 11, denomination: 12 },
          { level: 17, number: 2, denomination: 6 },
        ].map((data) => {
          const changes = [
            DDBEnricherData.ChangeHelper.overrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("mgc", 20, "system.properties"),
            DDBEnricherData.ChangeHelper.overrideChange(`${data.number ?? 1}`, 20, "system.damage.base.number"),
            DDBEnricherData.ChangeHelper.overrideChange(`${data.denomination}`, 20, "system.damage.base.denomination"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("force", 20, "system.damage.base.types"),
          ];
          const spellcastingChanges = type !== "Physical"
            ? [DDBEnricherData.ChangeHelper.overrideChange("spellcasting", 20, "system.ability")]
            : [];

          return {
            name: `Shillelagh (${type}) - Level ${data.level}`,
            type: "enchant",
            changes: [...changes, ...spellcastingChanges],
          };
        });
      }).flat();
    }

  }


}
