RESOURCES = [];

function initResource(displayName, canHarvest, isVisible){
    RESOURCES.push({
        displayName: displayName,
        canHarvest: canHarvest,
        isVisible: isVisible
    })
}

initResource("First", true, true);
initResource("Second", true, true);
initResource("Longer Resource Name", true, true);

for (let i=0; i<10; i++){
    initResource("TEMP_"+i, true, true);
}