import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfConquest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage",
      noeffect: true,
      targetType: "enemy",
      data: {
        range: {
          value: "@scale.conquest.aura-of-conquest",
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "floor(@classes.paladin.levels / 2)",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            // the aura-of-conquest scale is the aura's radius; without this the character import
            // (CharacterFeatureFactory._setLevelScales) swaps it in as the damage formula
            skipScale: true,
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
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
