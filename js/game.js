

class Resource{
    constructor(displayName, canHarvest, isVisible){
        this.displayName = displayName;
        this.name = displayName.toLowerCase().replace(/\s/, '_').replace(/[^\w]/, '');
        // this.name = name;
        this.lastAmount = bigInt(-1);
        this.amount = bigInt(0);
        this.manualBaseChange = bigInt(1);
        this.autoBaseChange = bigInt(1);
        this.isAuto = !canHarvest;
        this.manualModifier = 1.0;
        this.autoModifier = 1.0;
        this.labelId = "lbl-"+this.name;
        this.lastCapacity = bigInt(-1);
        this.capacity = bigInt(1000);
        this.canHarvest = canHarvest;
        this.isVisible = isVisible;
    }

    createCard(parentQuery){
        // Display the name/set initial visibility
        let toAppend = "<div class=\'list-group-item "+(this.isVisible?"":"hidden-xs-up")+"\'><h4 class=\'col-sm-8\'>"+this.displayName+"</h4>";

        // If we can manually harvest, display the button
        if (this.canHarvest){
            toAppend += "<div class=\'col-sm-4\'><button class='float-right btn btn-sm btn-outline-success btn-harvest' value='"+this.name+"'><span class='fa fa-plus'></span></button></div>"
        } else {
            toAppend += "<div class='col-sm-4'></div>";
        }

        // Display quantity info
        toAppend += "<div class='col-9 col-sm-5'><div class='progress'><div class='progress-bar' id='"+this.labelId+"-progressbar' role='progressbar' style='width:0; height:5px;'></div></div></div>";
        toAppend += "<div class='col-sm-9'><span class='float-sm-right'><b>Stored Amount</b></span></div>";
        toAppend += "<div class='col-9 col-sm-3'><span id='"+this.labelId+"-quantity' class='float-right float-sm-left'></span></div>";
        toAppend += "<div class='col-sm-9'><span class='float-sm-right'><b>Capacity</b></span></div>";
        toAppend += "<div class='col-9 col-sm-3'><span id='"+this.labelId+"-capacity' class='float-right float-sm-left'></span></div>";


        $(parentQuery).append(toAppend);
    }

    // createCard(parentQuery){
    //     let toAppend = "<div class='list-group-item'>" +
    //         "<div class='row'>"+
    //         "<h4 class='col-8'>" + this.displayName + "</h4>";
    //
    //     if (this.canHarvest){
    //         toAppend += "<div class='col-4'><button class='btn btn-success btn-sm "+MANUAL_HARVEST+" float-right' id='"+this.labelId+"-harvest-button' value='"+this.name+"'><span class='fa fa-plus'></span></button></div>";
    //     } else {
    //         toAppend += "<div class='col-4'></div>";
    //     }
    //     toAppend += "</div>" +
    //         "<div class='row list-group'>" +
    //         "<div class='list-group-item'>" +
    //         "Stored Amount: <span id='"+this.labelId+"'></span>" +
    //         "</div>" +
    //         "Capacity: <span id='"+this.labelId+"-capacity'></span><br/>" +
    //         "<div class='progress'>" +
    //         "<div class='progress-bar' id='"+this.labelId+"-progressbar' role='progressbar' style='width: 0; height: 5px;'></div>" +
    //         "</div>" +
    //         "</div>" +
    //         "</div>";
    //
    //     $(parentQuery).append(toAppend);
    // }

    static getFromObject(resourceObject){
        return new Resource(
            resourceObject.displayName,
            resourceObject.canHarvest,
            resourceObject.isVisible
        )
    }

    // Only allowed to add non-negative amounts
    addAmount(/*bigInt*/ amountToAdd){
        if (amountToAdd.compare(bigInt.zero) < 0){
            return;
        }
        this.amount = this.amount.add(amountToAdd);
        let excess = 0;
        if (this.amount.greater(this.capacity)){
            excess = this.amount.subtract(this.capacity);
            this.amount = this.capacity;
        }
        // todo possibly handle excess in some way?

        //after adding, we need to update the shown amount
        this.updateShownAmount();
    }

    updateShownAmount(){
        if (this.amount.notEquals(this.lastAmount)){
            this.lastAmount = this.amount;
            $("#"+this.labelId+"-quantity").text(fbi(this.amount));
            this.updateProgressBar();
            // $("#"+this.labelId+"-progressbar").width(percentage(this.amount, this.capacity)+"%");
        }
    }

    updateProgressBar(){
        let bar = $("#"+this.labelId+"-progressbar");
        let percent = percentage(this.amount, this.capacity);
        if (percent < 75){
            $(bar).removeClass("bg-warning");
            $(bar).removeClass("bg-danger");
            $(bar).addClass("bg-success");
        } else if (percent < 100){
            $(bar).removeClass("bg-success");
            $(bar).removeClass("bg-danger");
            $(bar).addClass("bg-warning");
        } else {
            $(bar).removeClass("bg-warning");
            $(bar).removeClass("bg-success");
            $(bar).addClass("bg-danger");
        }
        $(bar).width(percent+"%");
    }

    updateCapacity(){
        if (this.capacity.notEquals(this.lastCapacity)){
            this.lastCapacity = this.capacity;
            $("#"+this.labelId+"-capacity").text(fbi(this.capacity));
        }
    }

    autoClick(){
        if (!this.isAuto || !this.isVisible){
            return;
        }
        this.addAmount(this.getAutoAmountAfterModification());
    }

    manualClick(){
        if (this.isVisible && this.canHarvest){
            this.addAmount(this.getManualAmountAfterModification());
        }
    }

    static getModifiedAmount(base, mod){
        let value = base.multiply(mod - (mod%1));
        if (mod%1>0){
            mod = (mod%1)*1000;
            mod -= (mod%1);
            value = value.add(base.multiply(mod).divide(1000));
        }
        return value;
    }

    getManualAmountAfterModification(){
        return Resource.getModifiedAmount(this.manualBaseChange, this.manualModifier);
    }

    getAutoAmountAfterModification(){
        return Resource.getModifiedAmount(this.autoBaseChange, this.autoModifier);
    }
}

class Game{
    constructor(){
        this.resourceNames = [];
        this.resources = {};
        for (let i=0; i<RESOURCES.length; i++){
            this.initResourceFromObject(RESOURCES[i]);
        }
    }

    update(){
        for (let i=0; i<this.resourceNames.length; i++){
            let rName = this.resourceNames[i];
            this.resources[rName].autoClick();
        }
    }

    initResourceFromObject(resource){
        let res = Resource.getFromObject(resource);
        let name = res.name;
        this.resourceNames.push(name);
        this.resources[name] = res;//Resource.getFromObject(resource);
        this.resources[name].createCard("#resource-group");
        this.resources[name].updateShownAmount();
        this.resources[name].updateCapacity();
    }

    manualClick(name){
        if (name in this.resources){
            this.resources[name].manualClick();
        }
    }

}


$(function(){
    $(window).keydown(function(event){
        if (event.keyCode === 13){
            event.preventDefault();
            return false;
        }
    });

    // setup the game
    let game = new Game();

    // setup interactions
    // When we click one of the manual harvest buttons
    $(".btn-harvest").on('click', function(){
        game.manualClick($(this).attr("value"));
    });


    // start game loop
    setInterval(function(){game.update()}, 100);
});