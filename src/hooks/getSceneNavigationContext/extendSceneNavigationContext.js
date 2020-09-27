import utils from "../../utils.js";

const getSceneRelatedJournalEntries = (sceneId) => {
  return game.journal.filter((je) => {
    return je.data.flags && je.data.flags.ddbimporter && je.data.flags.ddbimporter.sceneId && je.data.flags.ddbimporter.sceneId === sceneId;
  });
};

/**
 * Prepares the scene data for upload to vttassets.com as a user-submission for walling/scene adjustments
 * @param {Scene} scene
 */
const collectSceneData = (scene) => {
  if (!scene.data.flags.ddbimporter || !scene.data.flags.ddbimporter.sceneId) {
    return "Scene submission failed: No VTTA imported scene";
  }
  if (!window.ddbimporter.pid) {
    return "Scene submission failed: No Collaborateur flag found";
  }

  /**
   * Extracts all notes that have been placed by VTTA
   * Creates the expected data structure for the database by
   * getting the real label from the appropriate Journal Entry
   * @param {Scene} scene The scene to extract the notes from
   */
  const getNotes = (scene) => {
    // get all notes in the Journal related to this scene
    let relatedJournalEntries = getSceneRelatedJournalEntries(scene.data.flags.ddbimporter.sceneId);

    // get all notes placed on the map
    let notes = scene.data.notes
      // the user might have placed a note, unless it is based on an imported Journal Entry, we will not carry
      // that one over
      .filter((note) => {
        let je = relatedJournalEntries.find((je) => je._id === note.entryId);
        if (!je) return false;
        const result = !!(je && je.data.flags.ddbimporter && je.data.flags.ddbimporter.name);
        return result;
      })
      .map((note) => {
        let je = relatedJournalEntries.find((je) => je._id === note.entryId);
        const index = parseInt(je.data.name.substring(0, 2));
        return {
          index: index,
          label: je.data.name.substring(3),
          name: je.data.flags.ddbimporter.name,
          x: note.x,
          y: note.y,
        };
      })
      .reduce((notes, note) => {
        let idx = notes.find((n) => n.index === note.index);
        if (idx) {
          idx.positions.push({ x: note.x, y: note.y });
        } else {
          notes.push({ label: note.name, index: note.index, positions: [{ x: note.x, y: note.y }] });
        }
        return notes;
      }, [])
      .sort((a, b) => {
        return a.index - b.index;
      })
      .map((note) => ({ label: note.label, positions: note.positions }));

    return notes;
  };

  let notes;
  try {
    notes = getNotes(scene);
  } catch (error) {
    window.ddbimporter.notification.show(error);
    return [];
  }

  const data = {
    pid: window.ddbimporter.pid,
    sceneId: scene.data.flags.ddbimporter.sceneId,
    name: scene.data.name,
    // dimensions
    width: scene.data.width,
    height: scene.data.height,
    // grid
    grid: scene.data.grid,
    gridDistance: scene.data.gridDistance,
    gridType: scene.data.gridType,
    gridUnits: scene.data.gridUnits,
    shiftX: scene.data.shiftX,
    shiftY: scene.data.shiftY,
    // customization
    backgroundColor: scene.data.backgroundColor,
    // notes
    descriptions: notes,
    walls: scene.data.walls.map((wall) => ({
      c: wall.c,
      door: wall.door,
      ds: wall.ds,
      move: wall.move,
      sense: wall.sense,
    })),
    lights: scene.data.lights.map((light) => ({
      angle: light.angle,
      bright: light.bright,
      darknessThreshold: light.darknessThreshold,
      dim: light.dim,
      rotation: light.rotation,
      t: light.t,
      tintAlpha: light.tintAlpha,
      x: light.x,
      y: light.y,
    })),
  };
  return data;
};

const uploadSceneSubmission = (data) => {
  const API = "https://www.vttassets.com/api/v2/dndbeyond/scene/submission";
  // const API = "http://localhost:3001/api/dndbeyond/scene/submission";
  const URL = API + `?pid=${data.pid}&sceneId=${data.sceneId}`;

  try {
    fetch(URL)
      .then((response) => response.json())
      .then(async (json) => {
        if (json.status === "error") {
          return window.vtta.notification.show(`<h1>Sorry!</h1><p>${json.message}</p>`);
        }

        const SUBMIT_BUTTON = "Submit Scene";
        const CANCEL_BUTTON = "Cancel";

        let username = game.settings.get("ddb-importer", "scene-submission-username");
        if (username === "") {
          username = json.patron.fullName;
          game.settings.set("ddb-importer", "scene-submission-username", json.patron.fullName);
        }

        let changelog = "";

        // construct the UI
        let text = $(`<h1>Scene Submission</h1><p>When you hit submit, the scene adjustments like image dimensions, grid size and shift; wall, light and note information related to the imported Journal Entries are collected and submitted to vttassets.com for review. After approval, <b>your submission</b> will be used for everyone importing the same scene! Thank you for your contribution!</p>
          <p class="ddbimporter input sceneSubmission">
            <label for="username">Scene submission username</label>
            <input type="text" name="username" value="${username}" />
          </p>
          <p class="ddbimporter input sceneSubmission">
            <label for="changelog">Change description</label>
            <input type="text" name="changelog" value="${changelog}" placeholder="Example: Adjusted map dimensions, placed Journal Entries"/>
          </p>
          <p>You ${
            json.hasSubmitted
              ? `<b>already submitted this map</b> and your submission will be updated`
              : `never submitted this map`
          }, there are <b>${json.numAcceptedSubmissions} accepted prior versions</b> of this map and <b>${
          json.numOpenSubmissions
        } in submissions queued for review</b>.
          </p>
          <p><b>Please note:</b> The scene submission username will e.g. be displayed as a Discord announcement when your submitted data is reviewed and approved. It is totally fine to use a pseudonym, but by pressing the "Submit Scene" button below, you are expressing your willingness that the aforementioned username will be publicly visible and that the submitted scene data can be made publicly available.</p>
          <hr />`);

        // when the user changes the value of the username on the form, we will
        // save that to the config for future reference. We want everyone to feel good
        // about submitting personal data
        $('input[name="username"]', text).on("change paste keyup", (event) => {
          username = event.currentTarget.value;
        });

        $('input[name="changelog"]', text).on("change paste keyup", (event) => {
          changelog = event.currentTarget.value;
        });

        // Welcome - hidden on "Next"
        let result = await window.ddbimporter.hint.show(text, {
          align: "CENTER",
          buttons: [CANCEL_BUTTON, SUBMIT_BUTTON],
          width: window.innerWidth * 0.5,
        });

        if (result === SUBMIT_BUTTON) {
          // set the user-filled in username into the game settings for future reference
          game.settings.set("ddb-importer", "scene-submission-username", username);

          const submissionData = {
            meta: {
              pid: data.pid,
              sceneId: data.id,
              username: username,
              changelog: changelog,
            },
            scene: data,
          };

          // transmit the collected scene data alongside the meta information to the vttassets.com server
          fetch(URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(submissionData),
          })
            .then((response) => response.json())
            .then(() => {
              window.ddbimporter.notification.show(
                "<h1>Scene submitted</h1><p><b>Thank you!</b> I will review your submission soon."
              );
            })
            .catch((error) => {
              return window.ddbimporter.notification.show(`<h1>Sorry!</h1><p>${error}</p>`);
            });
        }
        return true;
      })
      .catch((error) => {
        return utils.log(error);
      });
  } catch (error) {
    window.ddbimporter.notification.show(
      `<h1>Sorry!</h1><p>There was an error reaching vttassets.com to submit your scene data. Please try again later.</p>`
    );
  }
};

export default (html, contextOptions) => {
  contextOptions.push({
    name: "ddb-importer.scenes.gm-enabled",
    callback: () => {
      return true;
    },
    condition: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      return (
        scene.data.flags &&
        scene.data.flags.ddbimporter &&
        scene.data.flags.ddbimporter.alt &&
        scene.data.flags.ddbimporter.alt.GM &&
        scene.img === scene.data.flags.ddbimporter.alt.GM
      );
    },
    icon: "<i class='fas fa-map active'></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.gm-enable",
    callback: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      // keep Foundry from setting the image dimensions to original image dimensions

      return scene
        .update({
          img: scene.data.flags.ddbimporter.alt.GM,
          width: scene.data.flags.ddbimporter.width,
          height: scene.data.flags.ddbimporter.height,
          thumb: scene.data.flags.ddbimporter.thumb,
        })
        .then(() => {
          // re-set to the original thumb and the original dimensions
          return scene
            .update({
              thumb: scene.data.flags.ddbimporter.thumb,
              width: scene.data.flags.ddbimporter.width,
              height: scene.data.flags.ddbimporter.height,
            })
            .then(() => {
              return canvas.draw();
            });
        });
    },
    condition: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      return (
        scene.data.flags &&
        scene.data.flags.ddbimporter &&
        scene.data.flags.ddbimporter.alt &&
        scene.data.flags.ddbimporter.alt.GM &&
        scene.img !== scene.data.flags.ddbimporter.alt.GM
      );
    },
    icon: "<i class='far fa-map'></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.player-enabled",
    callback: () => {
      return true;
    },
    condition: (li) => {
      $(li).addClass("active");
      const scene = game.scenes.get(li.data("sceneId"));
      return (
        scene.data.flags &&
        scene.data.flags.ddbimporter &&
        scene.data.flags.ddbimporter.alt &&
        scene.data.flags.ddbimporter.alt.Player &&
        scene.img === scene.data.flags.ddbimporter.alt.Player
      );
    },
    icon: "<i class='fas fa-map active'></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.player-enable",
    callback: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));

      return scene.update({ img: scene.data.flags.ddbimporter.alt.Player }).then(() => {
        // re-set to the original thumb
        // we cannot keep Foundry from generating it's own
        return scene
          .update({
            thumb: scene.data.flags.ddbimporter.thumb,
            width: scene.data.flags.ddbimporter.width,
            height: scene.data.flags.ddbimporter.height,
          })
          .then(() => {
            return canvas.draw();
          });
      });
    },
    condition: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      return (
        scene.data.flags &&
        scene.data.flags.ddbimporter &&
        scene.data.flags.ddbimporter.alt &&
        scene.data.flags.ddbimporter.alt.Player &&
        scene.img !== scene.data.flags.ddbimporter.alt.Player
      );
    },
    icon: "<i class='far fa-map'></i>",
  });

  contextOptions.push({
    name: "ddb-importer.scenes.share",
    callback: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      let data = collectSceneData(scene);
      if (typeof data === "string") {
        window.ddbimporter.notification.show(data);
        return false;
      }
      return uploadSceneSubmission(data);
    },
    condition: (li) => {
      const scene = game.scenes.get(li.data("sceneId"));
      return (
        scene.data.flags &&
        scene.data.flags.ddbimporter &&
        scene.data.flags.ddbimporter.sceneId &&
        window.ddbimporter &&
        window.ddbimporter.pid !== undefined &&
        window.ddbimporter.pid !== null
      );
    },
    icon: '<i class="fas fa-share-alt"></i>',
  });
};
