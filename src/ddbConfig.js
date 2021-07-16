export var DDB_CONFIG;

async function getDDBConfig() {
  DDB_CONFIG = await $.getJSON("https://www.dndbeyond.com/api/config/json");
}

export function loadDDBConfig() {
  if (!DDB_CONFIG) {
    getDDBConfig();
  }
}

