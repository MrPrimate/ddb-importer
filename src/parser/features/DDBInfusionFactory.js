import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { DDBInfusion } from "./DDBInfusion.js";

export class DDBInfusionFactory {

  constructor(ddbCharacter) {
    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbCharacter.source.ddb;
    this.rawCharacter = ddbCharacter.raw.character;

    this.processed = {
      actions: [],
      infusions: [],
    };
  }

  updateIds(type) {
    this.ddbCharacter.updateItemIds(this.processed[type]);
  }

  async processInfusions() {
    logger.debug("Parsing infusions");
    for (const infusion of (foundry.utils.getProperty(this.ddbData, "infusions.infusions.definitionData") ?? [])) {
      const ddbInfusion = new DDBInfusion({
        ddbData: this.ddbData,
        ddbInfusion: infusion,
        rawCharacter: this.rawCharacter,
      });
      await ddbInfusion.build();
      logger.debug(`DDBInfusion: ${ddbInfusion.ddbInfusion.name}`, {
        ddbInfusion,
        infusion,
        this: this,
      });
      this.processed.infusions.push(ddbInfusion.data);
      this.processed.actions.push(...ddbInfusion.actions);
    }
    this.updateIds("infusions");
    this.updateIds("actions");
  }


  _getInfusionItemMap(item) {
    const infusionDetails = foundry.utils.getProperty(this.ddbData, "infusions");
    if (!infusionDetails?.item) return undefined;
    return infusionDetails.item.find((mapping) =>
      mapping.itemId === item.flags.ddbimporter.definitionId
      && mapping.inventoryMappingId === item.flags.ddbimporter.id
      && mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId
    );
  }


  // adjust this to find the imported infusions
  _getInfusionDetail(definitionKey) {
    if (!this.ddbData.infusions?.infusions?.definitionData) return undefined;
    return this.ddbData.infusions.infusions.definitionData.find(
      (infusion) => infusion.definitionKey === definitionKey
    );
  }

  addInfusionsToItem(foundryItem, ddbItem) {
    // get item mapping
    const infusionItemMap = this.getInfusionItemMap(foundryItem);
    foundryItem.flags.infusions = { maps: [], applied: [], infused: false };
    // sometimes ddb keeps dead infusions around - notably homonculus
    const infusionDetail = infusionItemMap
      ? this._getInfusionDetail(this.ddbData, infusionItemMap.definitionKey)
      : undefined;

    if (infusionItemMap && infusionDetail) {
      logger.debug(`Infusion detected for ${foundryItem.name}`);

      // add infusion flags
      foundryItem.flags.infusions.infused = true;

      // set magic properties
      utils.addToProperties(foundryItem.system.properties, "mgc");

      // adjust name for infused item
      if (!foundryItem.name.includes("[Infusion]")) foundryItem.name += " [Infusion]";
      // if item is loot, lets move it to equipment/trinket so effects will apply
      if (foundryItem.type === "loot") {
        foundryItem.type = "equipment";
        foundryItem.system.armor = {
          type: "trinket",
          value: 10,
          dex: null,
        };
        // infusions will over ride the can equip status, so just check for equipped
        foundryItem.system.equipped = ddbItem.equipped;
      }

      // TO DO: move this effect to the enchantment item
      // check to see if we need to fiddle attack modifiers on infused weapons
      if (foundryItem.type === "weapon") {
        const intSwap = DDBHelper.filterBaseModifiers(this.ddbData, "bonus", {
          subType: "magic-item-attack-with-intelligence",
        }).length > 0;
        if (intSwap) {
          const characterAbilities = this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities;
          const mockAbility = foundry.utils.getProperty(foundryItem, "flags.ddbimporter.dndbeyond.ability");
          if (characterAbilities.int.value > characterAbilities[mockAbility].value) {
            foundryItem.system.ability = "int";
          }
        }
      }

    } else if (infusionItemMap && !infusionDetail) {
      logger.warn(`${foundryItem.name} marked as infused but no infusion info found`);
    }
    return foundryItem;

  }


}
