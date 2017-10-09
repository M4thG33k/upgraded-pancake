RESOURCES = [];

function initResource(displayName, canHarvest, isVisible){
    RESOURCES.push({
        displayName: displayName,
        canHarvest: canHarvest,
        isVisible: isVisible
    })
}

initResource("First", true, true);
initResource("Second", false, true);
initResource("Longer Resource Name", true, true);