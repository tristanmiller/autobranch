//window.onbeforeunload = function () {
  //window.scrollTo(0, 0);
//}

	
	var title = document.querySelector("#theTitle");
	var canvas0 = document.querySelector("#canvas0");
	var ctx0 = canvas0.getContext("2d");
	

	var width = canvas0.width; //main dimensions of the 'world' - canvas0 is the 'base layer' of the animation
	var height = canvas0.height;
	
	//create canvases that never appear onscreen or in the DOM but are used for layered rendering
	var canvas1 = document.createElement("canvas");
	canvas1.width = width;
	canvas1.height = height;
	var ctx1 = canvas1.getContext("2d");

	var canvas2 = document.createElement("canvas");
	canvas2.width = width;
	canvas2.height = height;
	var ctx2 = canvas2.getContext("2d");

	var canvas3 = document.createElement("canvas");
	canvas3.width = width;
	canvas3.height = height;
	var ctx3 = canvas3.getContext("2d");
	
	var controlPanel = document.getElementById("controls");
	controlPanel.addEventListener("input", doThing, false);
	
	var today = new Date();
	document.getElementById("status").innerHTML = today;
	
	function doThing(e){
		if (e.target !== e.currentTarget) {
			var inputSN = e.target.dataset.connectedto;
			var inputObject = Controls[inputSN];
			inputObject.applySliderValue(e.target.value);
		}
		e.stopPropagation();
	}


var viewport = document.getElementById("viewport");
var viewportW = viewport.clientWidth;
var viewportH = viewport.clientHeight;
viewport.pos = getPosition(viewport);

const default_velo = 0.00129; //ms^-1
const default_length = 100; //mm
const default_diam = 64; //mm
const default_area = Math.PI*Math.pow(default_diam,2); //mm^2
const default_t = 60000; // 'frames' per second

var Controls = [];
var Pumps = [];
var Valves = [];
var Sinks = [];
var Sources = [];
var Pipes = [];
var Tanks = [];


const rho = 1 // density of fluid, g/cm^3
const K = 2e9; //  bulk modulus of fluid, Pa
const timescale = 600; //how many frames are equivalent to 1 second?
var physicsSteps = 100; //how much to subdivide each frame for finer (more accurate?) calculations. 
var elementLength = 45; //mm 

const k = Math.pow(0.9981, (default_t/(timescale*physicsSteps))); 

while(timescale*physicsSteps*elementLength < 160000){ //Do not let timescale*physicsSteps*elementLength < 60000, oscillations become too nasty!
	physicsSteps *=2;
	elementLength += 2;
	console.log("eL = " + elementLength);
	console.log("pS = " + physicsSteps);

}


const pAtmo = 1e5; //atmospheric pressure, Pa

var thisNetwork = new Network();


var thisSource = new Source(64, elementLength, 0, elementLength, height/2);
thisSource.pressure = pAtmo;
thisSource.densityFromPressure(); 	


var inletValve = new Valve(64, 100, thisSource.posX + thisSource.length, 0.5*height, 0, elementLength, "Inlet Valve");
var	thisPump = new Pump(64, 0, inletValve.endX, height/2, elementLength);
var thisValve = new Valve(38, 100, thisPump.posX + thisPump.length, 0.5*height, 0, elementLength, "Outlet Valve");
var thisPipe = new Pipe(38, 300, thisValve.endX, 0.5*height, elementLength);
var thisSink = new Sink(thisPipe.diam, elementLength, thisPipe.endX, thisPipe.posY);
var thisTank = new Tank(64, 50, 400, 0.95*height, elementLength, "tankytank");

var TtP1 = new Valve(64, 100, thisTank.endX, thisTank.posY, 1, elementLength, "Tank to Pump");
var TtP2 = new Valve(64, 100, thisTank.posX - 100, thisTank.posY, 1, elementLength, "T2");
var TtP3 = new Valve(64, 100,width - elementLength, height - 64, 0, elementLength, "T3");
	
	thisNetwork.install([thisPump, thisPipe,thisValve, thisSink, thisSource, inletValve, thisTank, TtP1, TtP2, TtP3]);
	thisNetwork.connect([thisPump.end2, thisValve.end1], false);
	thisNetwork.connect([thisValve.end2, thisPipe.end1]);
	thisNetwork.connect([thisPipe.end2, thisSink], false);
	thisNetwork.connect([thisSource, inletValve.end1], true);

	//thisNetwork.connect([inletValve.end2, thisPump.inlet],false);
	
	thisNetwork.connect([thisTank.outlet, TtP1.end1]);
	thisNetwork.connect([TtP1.end2, thisPump.midPump]);
	thisNetwork.connect([inletValve.end2, TtP2.end1]);
	thisNetwork.connect([TtP2.end2, thisTank.inlet]);
	thisNetwork.connect([inletValve.end2, TtP3.end1]);
	thisNetwork.connect([TtP3.end2, thisPump.inlet]);
	
	var TtP2Slider = document.getElementById("T2control");
	var TtP2Label = document.getElementById("T2label");
	var TtP2Display = document.getElementById("T2controlDisplay");
	var TtP3Slider = document.getElementById("T3control");
	var TtP3Label = document.getElementById("T3label");
	var TtP3Display = document.getElementById("T3controlDisplay");
	TtP2Slider.parentNode.removeChild(TtP2Slider);
	TtP2Label.parentNode.removeChild(TtP2Label);
	TtP2Display.parentNode.removeChild(TtP2Display);
	TtP3Slider.parentNode.removeChild(TtP3Slider);
	TtP3Label.parentNode.removeChild(TtP3Label);
	TtP3Display.parentNode.removeChild(TtP3Display);
	
	
	

function drawWorld(){   ///main animation loop
	//console.log("=============")
	ctx0.fillStyle = "rgba(100,0,100,1)";
	ctx0.fillRect(0,0,width,height);
	
	for(var i = 0, l = TtP1.elements.length; i < l; i++){
		var elm = TtP1.elements[i];
		elm.pressure = pAtmo;
		elm.densityFromPressure();
	}

	TtP2.setting = TtP1.setting;
	TtP2.diam = TtP2.oDiam*TtP2.setting;
	TtP2.updateDiam(TtP2.diam, TtP2.elements);
	TtP3.setting = 1 - TtP1.setting;
	TtP3.diam = TtP3.oDiam*TtP3.setting;
	TtP3.updateDiam(TtP3.diam, TtP3.elements);
	
	
	for(var j = 0; j < physicsSteps; j++){
		thisNetwork.update(timescale*physicsSteps);	
	}
	
	ctx1.clearRect(0,0,width,height);
	thisNetwork.render(ctx1);
	ctx0.drawImage(canvas1,0,0);
	requestAnimationFrame(drawWorld);
}
console.log("All good!");
drawWorld();