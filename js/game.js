class Resource{
    constructor(displayName){
        this.displayName = displayName;
        this.name = displayName.toLowerCase().replace(/\s/, '_').replace(/[^\w]/, '');
        // this.name = name;
        this.lastAmount = bigInt(-1);
        this.amount = bigInt(0);
        this.manualBaseChange = bigInt(1);
        this.autoBaseChange = bigInt(1);
        this.isAuto = false;
        this.manualModifier = 1.0;
        this.autoModifier = 1.0;
        this.labelId = "lbl-"+this.name;
        this.lastCapacity = bigInt(-1);
        this.capacity = bigInt(1000);
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
            $("#"+this.labelId).text(fbi(this.amount));
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
        if (!this.isAuto){
            return;
        }

        this.addAmount(this.getAutoAmountAfterModification());
        // console.log(this.getAutoAmountAfterModification().toString());
        // this.addAmount(this.autoBaseChange.multiply(Math.floor(this.autoModifier)));
    }

    getAutoAmountAfterModification(){
        let mod = this.autoModifier;
        let whole = mod - (mod%1);
        let value = this.autoBaseChange.multiply(whole);
        // only add three decimal's worth of extra data
        if (mod%1>0){
            mod = (mod%1)*1000;
            mod -= (mod%1);
            value = value.add(this.autoBaseChange.multiply(mod).divide(1000));
        }
        return value;
    }
}

class Game{
    constructor(){
        let theList = $("#resource-list");
        this.resourceNames = [];
        for (let i=0; i<10; i++){
            this.resourceNames.push("TempResource" + i);
        }
        // this.resourceNames = ['Internets', 'Chocolate', 'Fruit Loops'];
        this.resources = {};
        for (let i=0; i<this.resourceNames.length; i++){
            this.initializeResource(this.resourceNames[i]);
            // this.resources[this.resourceNames[i]] = new Resource(this.resourceNames[i]);
            // let resource = this.resources[this.resourceNames[i]];
            // $(theList).append("<li>"+resource.displayName+": <span id='"+resource.labelId+"'></span></li>");
            // this.resources[this.resourceNames[i]].updateShownAmount();
        }
    }

    update(){
        for (let i=0; i<this.resourceNames.length; i++){
            let rName = this.resourceNames[i];
            this.resources[rName].autoClick();
        }
    }

    initializeResource(displayName){
        this.resources[displayName] = new Resource(displayName);
        let resource = this.resources[displayName];
        $("#resource-group").append(
            "<div class=\"card\">" +
            "<div class=\"card-block\">" +
            "<h4 class='card-title'>"+displayName+"</h4>" +
            "Stored Amount: <span id='"+resource.labelId+"'></span><br/>" +
            "Capacity: <span id='"+resource.labelId+"-capacity'></span><br/>" +
            "<div class='progress'>" +
            "<div class='progress-bar' id='"+resource.labelId+"-progressbar' role='progressbar' style='width: 25%; height:5px;'></div>" +
            "</div> " +
            "</div>" +
            "</div>"
        );
        resource.updateShownAmount();
        resource.updateCapacity();
    }


}

// function Game(){
//     this.buttons = {};
//     this.buttons['test'] = new Test('test', 0, "1");
//
//     this.update = function(){
//         for (let button in this.buttons){
//             this.buttons[button].update();
//         }
//     }
// }
//
// function Test(name, amount, change){
//     this.name = name;
//     this.amount = bigInt(amount);
//     this.change = bigInt(change);
//
//     $("#lbl-"+this.name).text(this.amount);
//
//     this.update = function(){
//         this.amount = this.amount.add(this.change);
//         $("#lbl-"+this.name).text(fbi(this.amount));
//     }
// }

// function Resource(name){
//     this.name = name;
//     this.delta = 0;
// }

$(function(){
    let game = new Game();

    setInterval(function(){game.update()}, 100);
});