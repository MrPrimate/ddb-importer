/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ShapeShift extends DDBEnricherData {

  get activity() {
    return {
      name: "Change Form",
      targetType: "self",
      data: {
        img: "systems/dnd5e/icons/svg/monster.svg",
        duration: {
          units: "disp",
        },
      },
    };
  }

  get effects() {
    return [
      {
        options: {
          transfer: false,
        },
        name: "Rat Form",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("20", 5, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 5, "system.attributes.movement.fly"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("icons/creatures/mammals/rodent-rat-green.webp", 5, "ATL.texture.src"),
        ],
        data: {
          img: "icons/creatures/mammals/rodent-rat-green.webp",
        },
      },
      {
        options: {
          transfer: false,
        },
        name: "Raven Form",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("20", 5, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("60", 5, "system.attributes.movement.fly"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("icons/creatures/birds/raptor-hawk-flying.webp", 5, "ATL.texture.src"),
        ],
        data: {
          img: "icons/creatures/birds/raptor-hawk-flying.webp",
        },
      },
      {
        options: {
          transfer: false,
        },
        name: "Spider Form",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("20", 5, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.overrideChange("20", 5, "system.attributes.movement.climb"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 5, "system.attributes.movement.fly"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("icons/creatures/invertebrates/spider-dotted-green.webp", 5, "ATL.texture.src"),
        ],
        data: {
          img: "icons/creatures/invertebrates/spider-dotted-green.webp",
        },
      },
    ];
  }

}
