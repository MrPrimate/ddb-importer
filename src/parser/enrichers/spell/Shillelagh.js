/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Shillelagh extends DDBEnricherMixin {

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
          DDBEnricherMixin.generateOverrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
          DDBEnricherMixin.generateUnsignedAddChange("mgc", 20, "system.properties"),
          DDBEnricherMixin.generateOverrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherMixin.generateOverrideChange("8", 20, "system.damage.base.denomination"),
        ];
        const spellCastingChanges = type !== "Physical"
          ? [DDBEnricherMixin.generateOverrideChange("spellcasting", 20, "system.ability")]
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
            DDBEnricherMixin.generateOverrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
            DDBEnricherMixin.generateUnsignedAddChange("mgc", 20, "system.properties"),
            DDBEnricherMixin.generateOverrideChange(`${data.number ?? 1}`, 20, "system.damage.base.number"),
            DDBEnricherMixin.generateOverrideChange(`${data.denomination}`, 20, "system.damage.base.denomination"),
            DDBEnricherMixin.generateUnsignedAddChange("force", 20, "system.damage.base.types"),
          ];
          const spellcastingChanges = type !== "Physical"
            ? [DDBEnricherMixin.generateOverrideChange("spellcasting", 20, "system.ability")]
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
