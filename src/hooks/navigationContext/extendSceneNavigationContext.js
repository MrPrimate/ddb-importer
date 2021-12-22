// import utils from "../../utils.js";
import { download } from "../../muncher/utils.js";
import { collectSceneData, SceneEnhancerExport } from "../../muncher/sceneEnhancer.js";

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
      const data = collectSceneData(scene, scene.data.flags.ddb.bookCode);
      const bookCode = `${scene.data.flags.ddb.bookCode}-${scene.data.flags.ddb.ddbId}`;
      const cobaltId = scene.data.flags.ddb?.cobaltId ? `-${scene.data.flags.ddb.cobaltId}` : "";
      const parentId = scene.data.flags.ddb?.parentId ? `-${scene.data.flags.ddb.parentId}` : "";
      const contentChunkId = scene.data.flags.ddb?.contentChunkId ? `-${scene.data.flags.ddb.contentChunkId}` : "";
      const name = scene.data.name.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      const sceneRef = `${bookCode}${cobaltId}${parentId}${contentChunkId}-${name}`;
      return download(JSON.stringify(data, null, 4), `${sceneRef}-scene.json`, "application/json");
    },
    condition: (li) => {
      const scene = game.scenes.get(getSceneId(li));
      const sceneDownload = game.settings.get("ddb-importer", "allow-scene-download");
      const allowDownload = game.user.isGM && sceneDownload && scene.data.flags.ddb?.ddbId;
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
      const allowDownload = game.user.isGM && sceneDownload && !scene.data.flags.ddb?.ddbId;
      return allowDownload;
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });
}
