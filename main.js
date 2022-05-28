let {readFileSync,writeFileSync} = require('fs')
let json           = require('./data.json')

let exec = require('child_process').exec


let data = readFileSync('bb.txt','UTF-8')

data = data.split('\n')


function hextoRBG(hex){
    return [
        parseInt(hex.slice(1,3),16),
        parseInt(hex.slice(3,5),16),
        parseInt(hex.slice(5,7),16)
    ]
}

let weights  = [0.475,0.2875,0.2375]

function hextoHSL(hex) {
    let [r,g,b] = hextoRBG(hex)
    r /= 255;
    g /= 255;
    b /= 255;

  // Find greatest and smallest channel values
    let cmin = Math.min(r,g,b),
    cmax = Math.max(r,g,b),
    delta = cmax - cmin
    let h=0,s=0,l=0

    if (delta == 0)
        h = 0;
    // Red is max
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax == g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);
        
    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        
    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return [h,s,l]
}


u=`#f44336]▓▓▓█[/color][`


function nearestColor(hex){
    
    let distances = []
    let distance  = 0
    let key       = {}
    let hsl       = hextoHSL(hex);

    for(i=0;i<256;i++){ 
        distance = (((json[i].hsl.h-hsl[0])*weights[0])**2 + ((json[i].hsl.s-hsl[1])*weights[1])**2 + ((json[i].hsl.l-hsl[2])*weights[2])**2)**0.5
        distances.push(distance)
        key[distance] = i
    }

    distances.sort()

    return json[key[distances[0]]].colorId
}

function BBtoBash(BBcolor){
    BBcolor =  BBcolor.split(']')
    let colorId = nearestColor(BBcolor[0])
    return '\\e[38;5;'+`${colorId}m${BBcolor[1].split('[')[0]}`
}


let cmd = ''

data.forEach(n=>{
    n=n.split('color=')
    n.forEach(m=>{
        try{
            cmd+=BBtoBash(m)
        }
        catch(e){}
    })
    cmd+="\n"
})

cmd = cmd.replace(/["]/g,'').replace(/[`]/g,'')

writeFileSync('output.sh',`echo -e "${cmd}"`)


script = exec("bash output.sh");

script.stdout.on('data', function(data){
    console.log(data.toString());
});

script.stderr.on('data', function(data){
    console.log(data.toString());
});
