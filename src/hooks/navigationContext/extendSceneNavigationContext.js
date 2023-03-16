// import utils from "../../lib/utils.js";
import FileHelper from "../../lib/FileHelper.js";
import { collectSceneData, SceneEnhancerExport } from "../../apps/SceneEnhancerExport.js";

function getSceneId(li) {
  return $(li).attr("data-document-id")
    ? $(li).attr("data-document-id")
    : $(li).attr("data-scene-id")
      ? $(li).attr("data-scene-id")
      : $(li).attr("data-entity-id");
}

export default function (html, contextOptions) {
  contextOptions.push({
    name: "ddb-importer.scenes.download",
    callback: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      const data = collectSceneData(scene, scene.flags.ddb.bookCode);
      const bookCode = `${scene.flags.ddb.bookCode}-${scene.flags.ddb.ddbId}`;
      const cobaltId = scene.flags.ddb?.cobaltId ? `-${scene.flags.ddb.cobaltId}` : "";
      const parentId = scene.flags.ddb?.parentId ? `-${scene.flags.ddb.parentId}` : "";
      const contentChunkId = scene.flags.ddb?.contentChunkId ? `-${scene.flags.ddb.contentChunkId}` : "";
      const name = scene.name.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      const sceneRef = `${bookCode}${cobaltId}${parentId}${contentChunkId}-${name}`;
      return FileHelper.download(JSON.stringify(data, null, 4), `${sceneRef}-scene.json`, "application/json");
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = game.settings.get("ddb-importer", "allow-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && scene.flags.ddb?.ddbId;
      return allowDownload;
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });

  contextOptions.push({
    name: "ddb-importer.scenes.third-party-download",
    callback: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      new SceneEnhancerExport(scene).render(true);
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = game.settings.get("ddb-importer", "allow-third-party-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && !scene.flags.ddb?.ddbId;
      return allowDownload;
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });
}
