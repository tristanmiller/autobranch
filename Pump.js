var Pump = function(diam, length, power, posX, posY, id){
	PipeElement.call(this, diam, length, posX, posY);
	this.power = power; //Js^-1
	this.id = id;
	if(id == null){this.id = "pump" + Pumps.length}
	this.label = this.id;

	Pumps.push(this); //add to the global list of Pumps, for auto-naming
	Controls.push(this);
	this.SN = Controls.length - 1;
	
	var controlPanel = document.getElementById("throttles");
	controlPanel.innerHTML += '<label for="'+ this.id + 'throttle" >Throttle: '+ this.id + '</label>';
	controlPanel.innerHTML += '<input type="range" id="' + this.id + 'throttle" class="comptrol" min = "0" max = "100" step = "0.10" value="' + this.power + '" data-connectedto="'+ this.SN +'" >';
	controlPanel.innerHTML += '<span id="'+ this.id + 'throttleDisplay">' + this.power + '</span>';
	
	
	this.divRep = document.createElement("div");
	this.divRep.className = 'component';
	this.style = this.divRep.style;
	this.style.left = (getPosition(viewport).x + this.posX - 75/2) + "px";
	this.style.top = (getPosition(viewport).y + this.posY - 75/2) + "px";
	viewport.appendChild(this.divRep);
	
	this.infobox = document.createElement("div");
	this.infobox.className = 'infobox';
	this.style = this.infobox.style;
	this.style.left = (getPosition(viewport).x + this.posX) + "px";
	this.style.top = (getPosition(viewport).y + this.posY) + "px";
	viewport.appendChild(this.infobox);
	
	


}

Pump.prototype = Object.create(PipeElement.prototype);
Pump.prototype.isPump = true;
Pump.prototype.maxPressure = 6000000;
Pump.prototype.colour = "rgba(100,100,100,1)";

Pump.prototype.update = function(time_scale) {
	var massOut = this.massFlow;
		
	if(this.pressure <= this.maxPressure){
		this.massFlow = this.massFlow + (this.density*1e6/time_scale)*((this.power/this.pressure));
		this.mass = this.mass + this.massFlow;
		if(this.mass < 0){this.mass = 0.001;}
		var oldDensity = this.density;
		this.density = this.mass/(this.volume/1000);
		var oldPressure = this.pressure;
		this.pressure = K*(1 - (oldDensity/this.density)) + oldPressure;
	} else {
		this.pressure = this.maxPressure;
		this.densityFromPressure();
	}
	this.colour = "hsla(200, 100%, " + 100*(this.pressure - 100000)/2900000 +"%, 1)" //pressure range between 2550000 and 0
	this.massFlow = massOut; //for testing of pump output visually
	this.velo = this.findVelo();
	
	this.infobox.innerHTML = '<div class="title">'+ this.label + '</div>throttle = ' + Math.round(this.power) + '%<br>pressure = ' + Math.round(this.pressure/1000) + 'kPa<br>mass = ' + Math.round(this.mass) + 'g<br>q = ' + Math.round(60*this.massFlow*timescale*physicsSteps) + 'L/min';

		
}

Pump.prototype.applySliderValue = function(val){
	this.power = val;
	document.getElementById(this.id + "throttleDisplay").innerHTML = this.power;
}

Pump.constructor = Pump;