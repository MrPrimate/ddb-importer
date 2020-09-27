// Port reactions or sending stuff to dndbeyond
import utils from '../utils.js';

let OutgoingCommunication = (port) => {
  return {
    updateActorHP: (actor, updateData) => {
      if (actor.data.type === 'character') {
        if (
          updateData.data &&
          updateData.data.attributes &&
          updateData.data.attributes.hp &&
          updateData.data.attributes.hp.value
        ) {
          let data = {
            character: actor.name,
            values: [{ name: 'hp.value', value: updateData.data.attributes.hp.value }],
          };
          utils.log(`Sending HP change for Actor ${actor.name}`, 'messaging');
          utils.log(data);
          port.send('set', data).then((response) => {
            utils.log(`Received response for HP change for Actor ${actor.name}`, 'communication');
            utils.log(response);
          });
        }
      }
    },
  };
};

export default OutgoingCommunication;
