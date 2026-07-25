import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBModifiers } from "../lib/_module";
import DDBRace from "../race/DDBRace";

DDBCharacter.prototype._generateRace = async function _generateRace(this: DDBCharacter, addToCompendium = false) {
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to generate race, no DDB source data");
    return;
  }
  const traits = ddb.character.race.racialTraits.map((r) => r.definition);
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traits, false);
  this._ddbRace = new DDBRace({
    ddbCharacter: this,
    compendiumRacialTraits,
  });
  await this._ddbRace.build();
  if (addToCompendium) {
    await this._ddbRace.addToCompendium(
      this.forceCompendiumUpdate,
      this.compendiumImportTypes,
      { collectOnly: this.collectCompendiumDocumentsOnly },
    );
  }
  this.raw.race = (this.updateItemIds([this._ddbRace.data]))[0];
  delete this.raw.race.sort;

  // update character race value with race type
  foundry.utils.setProperty(this.raw.character, "system.details.type.value", this.raw.race.type);

  const advancement = this.raw.race.system.advancement;
  if (!advancement) {
    logger.warn("Unable to process race advancement, race has no advancement data", { race: this.raw.race });
    return;
  }

  for (const [id, a] of Object.entries(advancement)) {
    switch (a.type) {
      case "AbilityScoreImprovement": {
        const assignments: Record<string, number> = {};
        a.value = {
          type: "asi",
          assignments,
        };
        DICTIONARY.actor.abilities.forEach((ability) => {
          const bonus = DDBModifiers
            .filterModifiersOld(ddb.character.modifiers.race, "bonus", `${ability.long}-score`, [null, ""])
            .filter((mod) => mod.entityId === ability.id)
            .reduce((prev, cur) => prev + (cur.value as number), 0);
          assignments[ability.value] = bonus;
        });
        break;
      }
      case "Size": {
        const modSize = DDBModifiers.filterModifiersOld(ddb.character.modifiers.race, "size");
        const configuredSizes = a.configuration.sizes ?? [];
        const size = configuredSizes.length === 1
          ? configuredSizes[0]
          // modSize is an array; the length === 1 guard means the single entry is the racial size mod
          : modSize && modSize.length === 1
            ? DICTIONARY.sizes.find((s) => modSize[0].subType === s.name.toLowerCase())?.value ?? `${this.raw.character.system.traits?.size}`
            : `${this.raw.character.system.traits?.size}`;
        a.value = {
          size: size as TActorSizes,
        };
        break;
      }
      // no default
    }
    advancement[id] = a;
  };
};
