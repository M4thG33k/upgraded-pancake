class Resource {
    constructor(displayName, canHarvest, isVisible) {
        this.displayName = displayName;
        this.name = displayName.toLowerCase().replace(/\s/, '_').replace(/[^\w]/, '');
        // this.name = name;
        this.lastAmount = bigInt(-1);
        this.amount = bigInt(0);
        this.manualBaseChange = bigInt(1);
        this.autoBaseChange = bigInt(1);
        this.isAuto = true;
        this.manualModifier = 1.0;
        this.autoModifier = 1.0;
        this.labelId = "lbl-" + this.name;
        this.lastCapacity = bigInt(-1);
        this.capacity = bigInt(100);
        this.canHarvest = canHarvest;
        this.isVisible = isVisible;
        this.excess = bigInt.zero;
        this.version = 0;
        this.delta = bigInt.zero;
    }

    getFullCard() {
        let toAppend = "";
        toAppend += "<h4 class=\'col-9 resource-title\' id='" + this.labelId + "-title'>" + this.displayName + "</h4>";

        // If we can manually harvest, display the button
        if (this.canHarvest) {
            toAppend += "<div class=\'col-3\'><button class='float-right btn btn-sm btn-outline-success btn-harvest' value='" + this.name + "'><span class='fa fa-plus'></span></button></div>"
        } else {
            toAppend += "<div class='col-3'></div>";
        }

        // Display quantity info
        toAppend += "<div class='col-9'><div class='progress'><div class='progress-bar' id='" + this.labelId + "-progressbar' role='progressbar' style='width:0; height:5px;'></div></div></div>";
        toAppend += "<div class='col-3' id='" + this.labelId + "-delta'></div>";
        toAppend += "<div class='col-9'><span class='float-right'><b>Stored Amount</b></span></div>";
        toAppend += "<div class='col-3'><span id='" + this.labelId + "-quantity' class='float-left'></span></div>";
        toAppend += "<div class='col-9'><span class='float-right'><b>Capacity</b></span></div>";
        toAppend += "<div class='col-3'><span id='" + this.labelId + "-capacity' class='float-left'></span></div>";

        return toAppend;
    }

    getSmallCard() {
        let toAppend = "";
        toAppend += "<span class=\'col-6 resource-title\' id='" + this.labelId + "-title'>" + this.displayName + "</span>";
        toAppend += "<div class='col-3'><div class='progress'><div class='progress-bar' id='" + this.labelId + "-progressbar' role='progressbar' style='width:0; height:5px;'></div></div></div>";
        // If we can manually harvest, display the button
        if (this.canHarvest) {
            toAppend += "<div class=\'col-3\'><button class='float-right btn btn-sm btn-outline-success btn-harvest' value='" + this.name + "'><span class='fa fa-plus'></span></button></div>"
        } else {
            toAppend += "<div class='col-3'></div>";
        }

        return toAppend;
    }

    switchCardVersion() {
        this.version = (this.version + 1) % 2;

        let label = "#"+this.labelId+"-card";

        let html = "";
        if (this.version === 0) {
            html = this.getFullCard();
            $(label).removeClass("p-0");

        } else if (this.version === 1) {
            html = this.getSmallCard();
            $(label).addClass("p-0");
        }
        $(label).html(html);

        this.updateShownAmount();
        this.updateCapacity();

    }

    createCard(parentQuery) {
        let pad = this.version === 0 ? "" : "p-0";
        // Display the name/set initial visibility
        let toAppend = "<div class=\'"+pad+" list-group-item " + (this.isVisible ? "" : "hidden-xs-up") + "\' id='" + this.labelId + "-card'>";

        if (this.version === 0) {
            toAppend += this.getFullCard();
        } else if (this.version === 1) {
            toAppend += this.getSmallCard();
        }
        toAppend += "</div>";

        $(parentQuery).append(toAppend);
    }

    static getFromObject(resourceObject) {
        return new Resource(
            resourceObject.displayName,
            resourceObject.canHarvest,
            resourceObject.isVisible
        )
    }

    // Call this method at the start of each tick to help setup stats
    openTick() {
        this.excess = bigInt.zero;
    }

    // Call this method at the end of a tick to perform graphical updates/stats/etc
    // This also makes sure that any lower-tiered resources that /can/ be used in the
    // creation of higher-tiered resources are used before they're "lost"
    closeTick(tps) {
        // todo possibly handle excess in some way?

        // created shows the change in amount between this tick and last.
        this.delta = this.amount.subtract(this.lastAmount);
        this.updateShownAmount();
        this.updateDisplayedRPS(tps);
        // this.updateResourcesPerSecond(tps, created);
    }

    updateDisplayedRPS(tps){
        let delta = this.delta;
        let netGain = delta.greaterOrEquals(bigInt.zero);
        delta = delta.abs();
        let html = "<span class=\'text-";
        if (netGain) {
            if (delta.equals(bigInt.zero)) {
                html += "warning";
            } else {
                html += "success";
            }
        } else {
            html += "danger";
        }

        let deltaView = multFloat(delta, tps);
        deltaView = (deltaView.equals(bigInt.zero) ? (delta.equals(bigInt.zero) ? "0" : "<1") : fbi(deltaView));
        html += "\'>" + deltaView + "</span>/" + fbi(multFloat(this.excess, tps));

        $("#" + this.labelId + "-delta").html(html);
    }

    // Only allowed to add non-negative amounts
    addAmount(/*bigInt*/ amountToAdd, /*boolean*/isManual = false) {
        if (amountToAdd.compare(bigInt.zero) < 0) {
            return;
        }
        this.amount = this.amount.add(amountToAdd);
        if (this.amount.greater(this.capacity)) {
            if (!isManual) {
                this.excess = this.excess.add(this.amount.subtract(this.capacity));
            }
            this.amount = this.capacity;
        }
    }

    updateShownAmount() {
        this.lastAmount = this.amount;
        $("#" + this.labelId + "-quantity").text(fbi(this.amount));
        this.updateProgressBar();
    }

    updateProgressBar() {
        let bar = $("#" + this.labelId + "-progressbar");
        let percent = percentage(this.amount, this.capacity);
        if (percent < 75) {
            $(bar).removeClass("bg-warning");
            $(bar).removeClass("bg-danger");
            $(bar).addClass("bg-success");
        } else if (percent < 100) {
            $(bar).removeClass("bg-success");
            $(bar).removeClass("bg-danger");
            $(bar).addClass("bg-warning");
        } else {
            $(bar).removeClass("bg-warning");
            $(bar).removeClass("bg-success");
            $(bar).addClass("bg-danger");
        }
        $(bar).width(percent + "%");
    }

    updateCapacity() {
        this.lastCapacity = this.capacity;
        $("#" + this.labelId + "-capacity").text(fbi(this.capacity));
    }

    autoClick() {
        if (!this.isAuto || !this.isVisible) {
            return;
        }
        this.addAmount(this.getAutoAmountAfterModification());
    }

    manualClick() {
        if (this.isVisible && this.canHarvest) {
            this.addAmount(this.getManualAmountAfterModification(), true);
            this.updateShownAmount();
        }
    }

    static getModifiedAmount(base, mod) {
        let value = base.multiply(mod - (mod % 1));
        if (mod % 1 > 0) {
            mod = (mod % 1) * 1000;
            mod -= (mod % 1);
            value = value.add(base.multiply(mod).divide(1000));
        }
        return value;
    }

    getManualAmountAfterModification() {
        return Resource.getModifiedAmount(this.manualBaseChange, this.manualModifier);
    }

    getAutoAmountAfterModification() {
        return Resource.getModifiedAmount(this.autoBaseChange, this.autoModifier);
    }
}

class Game {
    constructor() {
        this.shouldTick = true;
        this.tps = 1;
        this.resourceNames = [];
        this.resources = {};
        for (let i = 0; i < RESOURCES.length; i++) {
            this.initResourceFromObject(RESOURCES[i]);
        }
    }

    update() {
        //open the tick
        for (let i = 0; i < this.resourceNames.length; i++) {
            let rName = this.resourceNames[i];
            this.resources[rName].openTick();
        }

        // do work
        for (let i = 0; i < this.resourceNames.length; i++) {
            let rName = this.resourceNames[i];
            this.resources[rName].autoClick();
        }

        // close the tick
        for (let i = 0; i < this.resourceNames.length; i++) {
            let rName = this.resourceNames[i];
            this.resources[rName].closeTick(this.tps);
        }
    }

    initResourceFromObject(resource) {
        let res = Resource.getFromObject(resource);
        let name = res.name;
        this.resourceNames.push(name);
        this.resources[name] = res;//Resource.getFromObject(resource);
        this.resources[name].createCard("#resource-group");
        this.resources[name].updateShownAmount();
        this.resources[name].updateCapacity();
    }

    manualClick(name) {
        if (name in this.resources) {
            this.resources[name].manualClick();
        }
    }

    switchCardVersionFor(name) {
        console.log("Clicking " + name);
        if (name in this.resources) {
            this.resources[name].switchCardVersion();
        }
    }

}


$(function () {
    $(window).keydown(function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            return false;
        }
    });

    // setup the game
    let game = new Game();

    function tickGame() {
        if (game.shouldTick) {
            let length = Math.max(1, Math.ceil(1000 / game.tps));
            game.update();
            setTimeout(tickGame, length);
        }
    }

    // setup interactions
    // When we click one of the manual harvest buttons
    $(document).on('click', ".btn-harvest", function(){
    // $(".btn-harvest").on('click', function () {
        game.manualClick($(this).attr("value"));
    });
    // When we click on a resource's title, switch versions
    $(document).on('click', ".resource-title", function(){
    // $(".resource-title").on('click', function () {
        let name = $(this).attr('id');
        name = name.substr(4, name.length - 10);
        game.switchCardVersionFor(name);
    });


    // start game loop
    tickGame();
    // setInterval(function(){game.update()}, 100);
});