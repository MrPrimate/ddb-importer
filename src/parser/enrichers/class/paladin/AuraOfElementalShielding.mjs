/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AuraOfElementalShielding extends DDBEnricherData {
  get effects() {
    const types = [
      "Acid",
      "Cold",
      "Fire",
      "Lightning",
      "Thunder",
    ];
    const activeType = this.ddbParser.isMuncher
      ? null
      : this.ddbParser?._chosen?.find((a) =>
        types.includes(a.label),
      )?.label;

    return types.map((element) => {
      return {
        daeStackable: "noneNameOnly",
        name: `Aura of Elemental Shielding: ${element}`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(element.toLowerCase(), 20, "system.traits.dr.value"),
        ],
        options: {
          transfer: true,
          disabled: !activeType.includes(element),
        },
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: `@scale.paladin.${this.data.name.toLowerCase().replaceAll(" ", "-")}`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.paladin.${this.data.name.toLowerCase().replaceAll(" ", "-")}`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      };
    });

  }
}
