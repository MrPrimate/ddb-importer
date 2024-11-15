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
          DDBEnricherData.generateOverrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
          DDBEnricherData.generateUnsignedAddChange("mgc", 20, "system.properties"),
          DDBEnricherData.generateOverrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherData.generateOverrideChange("8", 20, "system.damage.base.denomination"),
        ];
        const spellCastingChanges = type !== "Physical"
          ? [DDBEnricherData.generateOverrideChange("spellcasting", 20, "system.ability")]
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
            DDBEnricherData.generateOverrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
            DDBEnricherData.generateUnsignedAddChange("mgc", 20, "system.properties"),
            DDBEnricherData.generateOverrideChange(`${data.number ?? 1}`, 20, "system.damage.base.number"),
            DDBEnricherData.generateOverrideChange(`${data.denomination}`, 20, "system.damage.base.denomination"),
            DDBEnricherData.generateUnsignedAddChange("force", 20, "system.damage.base.types"),
          ];
          const spellcastingChanges = type !== "Physical"
            ? [DDBEnricherData.generateOverrideChange("spellcasting", 20, "system.ability")]
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
