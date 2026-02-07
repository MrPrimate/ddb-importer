/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AuraOfConquest extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Damage",
      noeffect: true,
      targetType: "creature",
      data: {
        range: {
          value: "@scale.conquest.aura-of-conquest",
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@classes.paladin.levels",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Aura of Conquest",
        daeStackable: "none",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Enemy",
              radius: "@scale.conquest.aura-of-conquest",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.conquest.aura-of-conquest",
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
        },
        options: {
          transfer: true,
        },
      },
    ];
  }

}
