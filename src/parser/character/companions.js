import { logger } from "../../lib/_module.mjs";
import { DICTIONARY } from "../../config/_module.mjs";
import DDBCharacter from "../DDBCharacter.js";
import DDBCompanionFactory from "../companions/DDBCompanionFactory.mjs";


DDBCharacter.prototype.getClassFeature = function(name) {
  const klass = this.source.ddb.character.classes
    .find((k) => k.classFeatures.some((f) => f.definition.name == name));
  return klass?.classFeatures?.find((f) => f.definition.name == name);
};


DDBCharacter.prototype._parseCompanion = async function(html, type, originDocument) {
  const ddbCompanionFactory = new DDBCompanionFactory(html, {
    type,
    originDocument,
    is2014: foundry.utils.getProperty(originDocument, "flags.ddbimporter.is2014") ?? true,
  });
  await ddbCompanionFactory.parse();
  this.companionFactories.push(ddbCompanionFactory);
};

DDBCharacter.prototype._importCompanions = async function() {
  for (const factory of this.companionFactories) {
    await factory.updateOrCreateCompanions();
  }
};

DDBCharacter.prototype._getCompanionFeature = async function(featureName) {
  const feature = this.data.features.concat(this.data.actions).find((s) =>
    s.name === featureName || s.flags.ddbimporter?.originalName === featureName,
  );
  if (!feature) return;
  const ddbFeature = this.getClassFeature(featureName);
  if (!ddbFeature) return;
  await this._parseCompanion(ddbFeature.definition.description, "feature", feature);
};

DDBCharacter.prototype._getCompanionOption = async function(parentFeature, childName) {
  const feature = this.data.features.concat(this.data.actions).find((s) =>
    s.name === parentFeature
    || s.flags.ddbimporter?.originalName === parentFeature
    || s.name === `${parentFeature}: ${childName}`
    || s.flags.ddbimporter?.originalName === `${parentFeature}: ${childName}`,
  );
  if (!feature) return;
  const ddbOption = this.source.ddb.character.options.class.find((o) => o.definition.name == childName);
  if (!ddbOption) return;
  await this._parseCompanion(ddbOption.definition.description, "feature", feature);
};

DDBCharacter.prototype.generateCompanions = async function() {
  console.warn("OLD COMPANION PROCESSING DISABLED");
  return;
  for (const name of DICTIONARY.companions.COMPANION_FEATURES) {
    await this._getCompanionFeature(name);
  }
  // spells now munched during spell munch
  for (const [parentFeature, childNames] of Object.entries(DICTIONARY.companions.COMPANION_OPTIONS)) {
    for (const name of childNames) {
      await this._getCompanionOption(parentFeature, name);
    }
  }

  await this._importCompanions();

  this.companions = this.companionFactories.map((factory) => factory.companions);

  logger.debug("parsed companions", {
    factories: this.companionFactories,
    parsed: this.companions,
  });

  for (const factory of this.companionFactories) {
    await factory.addCompanionsToDocuments(this.data.features.concat(this.data.actions));
  }

  // different types of companion
  // ranger beast companions, classic and new
  // ranger drake warden
  // ranger other?
  // artificer steel defender
  // artificer homunculus
  // new summon spells
  // classic summons (not handled here)
  // druid circle of fire companion

};

