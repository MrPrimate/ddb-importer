export function earlySettings() {

  game.settings.register("ddb-importer", "show-munch-top", {
    name: "ddb-importer.show-munch-top.name",
    hint: "ddb-importer.show-munch-top.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("ddb-importer", "patreon-tier", {
    scope: "world",
    config: false,
    type: String,
    default: null,
  });

  game.settings.register("ddb-importer", "custom-proxy", {
    name: "ddb-importer.custom-proxy.name",
    hint: "ddb-importer.custom-proxy.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("ddb-importer", "encounter-muncher-enabled", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  // for D&D 5e 1.4 ac migrtion
  game.settings.register("ddb-importer", "ac-migration-complete-v1-4", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

}
