//Used to format the printing of bigInts
let FBI_F = "eng";

//only used for non-negative values
function fbi(bigint){
    let out = bigint.toString();
    switch (FBI_F){
        case "string":
            return out;
        case "sci":
            if (out.length > 3){
                out = out[0] + "." + out.substr(1,3) + "e" + (out.length-1);
            }
            return out;
        case "eng":
            if (out.length > 3){
                let numGroups = Math.floor(out.length / 3);
                let extra = out.length % 3;
                if (extra === 0){
                    extra = 3;
                    numGroups -= 1;
                }
                out = out.substr(0, extra) + "." + out.substr(extra, 3) + "e" + (numGroups*3);
            }
            return out;
        default:
            return out;
    }
}

function percentage(part, whole){
    return Math.round(part.multiply(10000).divide(whole).toJSNumber()/100);
}