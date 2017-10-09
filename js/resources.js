RESOURCES = [];

function initResource(displayName, canHarvest){
    RESOURCES.push({
        displayName: displayName,
        canHarvest: canHarvest
    })
}

initResource("First", true);
initResource("Second", false);