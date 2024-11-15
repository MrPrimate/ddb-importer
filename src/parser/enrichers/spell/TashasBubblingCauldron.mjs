/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class TashasBubblingCauldron extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      name: "Create Cauldron",
      noTemplate: true,
      profileKeys: [
        "TashasBubblingCauldron",
      ],
      addItemConsume: true,
      itemConsumeValue: "-@attributes.spelldc",
      data: {
        img: "systems/dnd5e/icons/svg/activity/summon.svg",
        target: {
          override: true,
          template: {
            count: "1",
            contiguous: false,
            type: "",
            size: "",
            height: "",
            units: "",
          },
          affects: {},
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Withdraw Potion",
          type: "utility",
        },
        build: {
          img: "systems/dnd5e/icons/svg/ink-pot.svg",
          generateDamage: true,
          generateConsumption: true,
          consumeItem: true,
          noSpellslot: true,
          generateAttack: false,
          noeffect: true,
          activationOverride: { type: "bonus", condition: "" },
        },
      },
    ];
  }

  get override() {
    let descriptionSuffix = "";
    if (this.ddbParser.itemCompendium) {
      const possibleItems = this.ddbParser.itemCompendium.index
        .filter((i) => ["common", "uncommon"].includes(i.system.rarity)
          && i.type == "consumable"
          && i.system.type.value === "potion"
          && i.name.toLowerCase().includes("potion"),
        );
      if (possibleItems.length > 0) {
        descriptionSuffix += `<details>
<summary><strong>Suggested Potions</strong></summary>`;
        for (const item of possibleItems) {
          descriptionSuffix += `<p>@UUID[${item.uuid}]</p>`;
        }
        descriptionSuffix += "</details>";
      }
    }
    descriptionSuffix += `
<section class="secret" id="secret-ddbTasBubCauldro">
<p><strong>Implementation Details</strong></p>
<p>The Uses of this spell represent the number of potions remaining in the cauldron, which is reset by the <strong>Create Cauldron</strong> activity.</p>
<p>The <strong>Withdraw Potion</strong> activity will consume a use of the cauldron.</p>
</section>`;
    return {
      descriptionSuffix,
      data: {
        "system.uses": {
          max: "@attributes.spellmod",
          spent: "0",
        },
      },
    };
  }

}
