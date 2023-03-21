// @input string stateName
// @input float timeSpeed
// @input float timeAccel

// @input SceneObject[] enabledObjects
// @input SceneObject[] clearChildren {"label":"Clear Children of..."}

script.api.stateSettings = {
    stateName: script.stateName,
    timeSpeed: script.timeSpeed,
    timeAccel: script.timeAccel,
    enabledObjects: script.enabledObjects,
    clearChildren: script.clearChildren,
};
