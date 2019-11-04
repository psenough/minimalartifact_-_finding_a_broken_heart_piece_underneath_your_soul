
var sync_stuff = false;

rand = function(n){
	return 0|(Math.random()*n);
};

var D = document;
var b = D.body;
var Ms = b.style;
Ms.margin='0px';
var blackcolor = Ms.background = "#000";
Ms.overflow = 'hidden';
var c = document.getElementById('c');

var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
//var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
//var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
var is_safari = navigator.userAgent.indexOf("Safari") > -1;
//var is_opera = navigator.userAgent.indexOf("Presto") > -1;
if ((is_chrome)&&(is_safari)) {is_safari=false;}

var backgroundAudio;
var analyser;
var bufferLength;
var dataArray;
				
function initAudio( cb ) {
	var context;
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		if (backgroundAudio != undefined) backgroundAudio.stop();
		context = new AudioContext();

		var request = new XMLHttpRequest();
		//if (is_safari) request.open('GET', 'esem_gre_ii.m4a', true);
		//	else request.open('GET', 'esem_gre_ii.ogg', true);		
		if (is_safari) request.open('GET', 'audio/ps_-_finding_a_broken_heart_piece_underneath_your_soul.m4a', true);
			else request.open('GET', 'audio/ps_-_finding_a_broken_heart_piece_underneath_your_soul.ogg', true);
		request.responseType = 'arraybuffer';
		console.log('requesting');

		// Decode asynchronously
		request.onload = function() {
			context.decodeAudioData(request.response, function(buffer) {
	  
				backgroundAudio = context.createBufferSource(); 	// creates a sound source
				backgroundAudio.buffer = buffer;                    // tell the source which sound to play
				backgroundAudio.connect(context.destination);       // connect the source to the context's destination (the speakers)
				backgroundAudio.loop = false;
				//backgroundAudio.start(0);
				
				analyser = context.createAnalyser();
				analyser.fftSize = 256;
				bufferLength = analyser.frequencyBinCount;
				dataArray = new Uint8Array(bufferLength);
				analyser.getByteTimeDomainData(dataArray);
				backgroundAudio.connect(analyser);
				/*analyser.connect(context.destination);*/
				
				// start canvas
				//drawCanvas();
	  
				console.log('decoded');

				cb();
	  
			}, function(evt) {
				console.log('failed to load buffer');
				console.log(evt);
			});
		}
		request.send();

	} catch(e) {
		console.log('Web Audio API is not supported in this browser');
		console.log(e);
		//drawCanvas();
	}
}

var img_ref = [];

function ImageLoader(Ref, ImgDir, Images, Callback){
    // Keep the count of the verified images
    var allLoaded = 0;

    // The object that will be returned in the callback
    var _log = {
        success: [],
        error: []
    };

    // Executed everytime an img is successfully or wrong loaded
    var verifier = function(){
        allLoaded++;

        // triggers the end callback when all images has been tested
        if(allLoaded == Images.length){
			//console.log(_log);
            Callback.call(undefined, _log);
        }
    };

    // Loop through all the images URLs
    for (var index = 0; index < Images.length; index++) {
        // Prevent that index has the same value by wrapping it inside an anonymous fn
        (function(i){
            // Image path providen in the array e.g image.png
            var imgSource = Images[i];
            var img = new Image();
            
            img.addEventListener("load", function(){
                _log.success.push(imgSource);
                verifier();
            }, false); 
            
            img.addEventListener("error", function(err){
                _log.error.push(imgSource);
                verifier();
            }, false); 
           //console.log(img_dir + imgSource);
            img.src = ImgDir + imgSource;
			
			Ref.push(img);
        })(index);
    }
}

var vignette;

b.onload = function() {
	
	vignette = new Image();
    vignette.src = './gfx/reference_vignette.png';
	vignette.addEventListener("load", function(){
		console.log('my vignette is dark and long!');
	}, false);
	
	ImageLoader(img_ref, './gfx/inercia_graphic_novel/', inercia_graphic_novel, 
		function(result){
			if(result.error.length != 0){
				// outputs: ["example.png", "example.jpg"]
				console.log("The following images couldn't be properly loaded: ", result.error);
			}

			// outputs: ["http://i.imgur.com/fHyEMsl.jpg"]
			console.log("The following images were succesfully loaded: ", result.success);
			//init();
			initAudio( function(){
				let dom = document.getElementById('btn');
				if (dom) {
					dom.value = 'Start Demo!';
					dom.disabled = false;
				}
			} );
	});
	
}

var w;
var h;
var ctx;
var values = [];

var init_time = (new Date()).getTime();

let scheduled_backgrounds;
let scheduled_overlays;

function drawCanvas() {

	function drawSyncBackground(timer) {
		let scheduled_pings = scheduled_backgrounds;
		for (let j=0; j<scheduled_pings.length; j++) {
			let timed = timer-scheduled_pings[j]['inittime'];
			let initimg = scheduled_pings[j]['initimg'];
			if ((timed > 0) && (timer < scheduled_pings[j]['endtime'])) {
				ctx.drawImage(img_ref[initimg],0,0,w,h);
			}
		}
	}
	
	function lerp (start, end, amt){
	  return (1-amt)*start+amt*end
	}
	
	function drawSyncOverlay(timer) {
		let scheduled_pings = scheduled_overlays;
		for (let j=0; j<scheduled_pings.length; j++) {
			let timed = timer-scheduled_pings[j]['inittime'];
			let initimg = scheduled_pings[j]['initimg'];
			if ((timed > 0) && (timer < scheduled_pings[j]['endtime'])) {
				let timedout = scheduled_pings[j]['endtime'] - scheduled_pings[j]['inittime'];
				var fader = timed/timedout*(10.0/2);
				if (fader < 0.0) fader = 0.0;
				if (timed > timedout*0.8) fader = 1.0 - ((timed - timedout*0.8)/(timedout*0.2));
				if (fader > 1.0) fader = 1.0;
				ctx.globalAlpha = fader*0.5;
				var sx = 20.0+Math.sin(timer*0.0001)*20.0;
				var sy = 20.0-Math.cos(timer*0.0001)*20.0;
				ctx.drawImage(img_ref[initimg],sx,sy,img_ref[initimg].width-sx,img_ref[initimg].height-sy,-sx,-sy,w+sx*2,h+sy*2);
				//ctx.drawImage(img_ref[initimg],0,0,w,h);
			}
		}
	}

	function drawThanos(timer) {
		
		analyser.getByteTimeDomainData(dataArray);
		let wb = w / bufferLength;	
		for(let i = 0; i < bufferLength; i++) {
			let v = dataArray[i] / bufferLength;
			let d = (1.0+Math.sin(v*20.0))*v*10.0;			
			//color = "rgba(255,255,255,"+v*0.25+")";
			ctx.save();
			//ctx.fillStyle = color;
			ctx.beginPath();
			ctx.moveTo(i*wb-d,0);
			ctx.lineTo(i*wb+wb+d,0);
			ctx.lineTo(i*wb+wb+d,h);
			ctx.lineTo(i*wb-d,h);
			//ctx.fill();
			ctx.closePath();
			ctx.clip();

			let slider = timer % img_ref.length;
			let index = slider; //idx*vnum+inner;

			ctx.save();
			var sx = 0.0;// 15.0+Math.sin(timer*0.0001)*15.0;
			var sy = 0.0;// 15.0-Math.cos(timer*0.0001)*15.0;
			//ctx.globalAlpha = 0.25;
			ctx.drawImage(img_ref[index],sx,sy,img_ref[index].width-sx,img_ref[index].height-sy,-sx,-sy,w+sx*2,h+sy*2);
			ctx.restore();
			
			ctx.restore();
		}
		
	}
	
	function drawSpyralFlare(timer) {

		let size = 60;
		let num = 45;
		let angle = (Math.PI*2)/num;		
		let phase1 = timer/125000;
		let phase2 = timer/15000;

		let posX = w*(0.5);
		let posY = h*(0.5);
		
		ctx.strokeStyle = "rgba(170,180,250,0.8)";
		//ctx.lineJoin = "round";
		
		for (var j=0; j<9; j++) {
		
			var thisb = parseInt((Math.sin(phase2*0.25 + j)+1.0)*5, 10);

			for (var i=0; i<num; i++) {			
					var opening = Math.sin(i*angle)*30 + j*100;
					ctx.lineWidth = parseInt((Math.random()*5)+1,10);
					size = 40+Math.sin(timer/1000)*10;
					ctx.save();
					ctx.translate( posX+Math.sin(i*angle+phase1)*opening, posY+Math.cos(i*angle+phase1)*opening );
					ctx.rotate(i*angle+Math.sin(phase2+Math.sin(i*angle))*4);
					ctx.beginPath();
					ctx.moveTo(-size*.5*j,-size*.5*j);
					ctx.lineTo(0,size);
					ctx.lineTo(size*.5*j,-size*.5*j);
					ctx.lineTo(size*.5,size*.5);
					
					ctx.closePath();
					ctx.stroke();
					ctx.restore();
			}
		}
		
	}
	
	let subtitle_cache = '';
	
	function updateSubtitles(timer) {
		let scheduled_pings = scheduled_subtitles;
		let thistext = '';
		for (let j=0; j<scheduled_pings.length; j++) {
			let timed = timer-scheduled_pings[j]['inittime'];
			if ((timed > 0) && (timer < scheduled_pings[j]['endtime'])) {
				thistext = scheduled_pings[j]['text'];
			}
		}
		if (thistext != subtitle_cache) {
			let dom = document.getElementById('subtitles-text');
			if (dom) {
				if (thistext == '') {
					dom.style.display = 'none';
				} else {
					dom.style.display = 'inline';
					dom.innerHTML = thistext;
					subtitle_cache = thistext;
				}
			}
		}
	}
	
	requestAnimationFrame( animate );

	function animate() {
		let timer;
		if (skip == true) timer = skip_timer;
		 else timer = ((new Date()).getTime()-init_time);
		if (timer < playtime) {
			requestAnimationFrame( animate );
		} else {
			backToStartScreen();
		}
		if (sync_stuff == true) {
			let dom = document.getElementById('timer');
			if (dom) dom.innerText = timer;
			//console.log(timer);
		}
		ctx.clearRect(0,0,w,h);
		
		drawSpyralFlare(timer);		
		
		ctx.globalAlpha = 0.75;
		drawSyncBackground(timer);
		
		ctx.globalAlpha = 0.2;
		drawThanos(timer);
		
		ctx.globalAlpha = 1.0;
		drawSyncOverlay(timer);
		
		// vignette
		ctx.globalAlpha = 1.0;
		ctx.drawImage(vignette,0,0,w,h);
		
		// global fader
		let fader = 0.0;
		// fadein
		fader = 1.0 - timer/playtime*10.0;
		if (timer > 5700) fader -= 0.5;
		if (fader < 0.0) fader = 0.0;
		// fadeout
		if (timer > playtime*0.9) fader = ((timer - playtime*0.9)/(playtime*0.1));
		// draw fader layer
		ctx.fillStyle = "rgba(0,0,0,"+fader+")";
		ctx.fillRect(0, 0, w, h);
		
		updateSubtitles(timer);
	}
}

let playtime = 233000;

window.onresize = resize;

function resize() {
	w = window.innerWidth;
	h = window.innerHeight;
	
	c.setAttribute("width", w);
	c.setAttribute("height", h);
	
	ctx = c.getContext("2d");
	ctx.width = w;
	ctx.height = h;
}

function start() {
	let dom = document.getElementById('starter_menu');
	if (dom) {//dom.parentNode.removeChild(dom);
		dom.style.display = "none";
	}

	resize();
	scheduled_backgrounds = [
		  {'inittime':  5700, 'initimg':  3, 'endtime': 10800} 
		 ,{'inittime': 10800, 'initimg':  1, 'endtime': 13000} 
		 ,{'inittime': 13000, 'initimg':  2, 'endtime': 14000}
		 ,{'inittime': 14000, 'initimg':  4, 'endtime': 15700}
		 ,{'inittime': 15700, 'initimg': 18, 'endtime': 16700}
		 ,{'inittime': 16700, 'initimg': 12, 'endtime': 17700}
		 ,{'inittime': 17700, 'initimg':  7, 'endtime': 18700}
		 ,{'inittime': 18700, 'initimg': 13, 'endtime': 19800}
		 ,{'inittime': 19800, 'initimg':  9, 'endtime': 20400}
		 ,{'inittime': 20400, 'initimg': 10, 'endtime': 51250}
		 ,{'inittime': 53000, 'initimg': 10, 'endtime': 64180}
		 ,{'inittime': 64180, 'initimg': 14, 'endtime': 65260}
		 ,{'inittime': 65260, 'initimg': 15, 'endtime': 65900}
		 ,{'inittime': 65900, 'initimg': 16, 'endtime': 66650}
		 ,{'inittime': 66650, 'initimg': 17, 'endtime': 80330}
		 ,{'inittime':140000, 'initimg': 12, 'endtime':142000}
		 ,{'inittime':144000, 'initimg': 13, 'endtime':144800}
		 ,{'inittime':146500, 'initimg':  9, 'endtime':168000}
	];
	scheduled_overlays = [
		  {'inittime': 41500, 'initimg': 11, 'endtime': 46000} 
		 ,{'inittime': 51250, 'initimg':  0, 'endtime': 53000}
		 ,{'inittime': 57000, 'initimg':  8, 'endtime': 62150}
		 ,{'inittime': 71650, 'initimg': 11, 'endtime': 78000}
		 ,{'inittime': 93000, 'initimg':  5, 'endtime':103000}
		 ,{'inittime': 96000, 'initimg': 11, 'endtime':103000}
		 ,{'inittime':102000, 'initimg': 19, 'endtime':107000}
		 ,{'inittime':110000, 'initimg': 28, 'endtime':118000}
		 ,{'inittime':114000, 'initimg': 11, 'endtime':119000}
		 ,{'inittime':117000, 'initimg': 21, 'endtime':124000}
		 ,{'inittime':132000, 'initimg':  3, 'endtime':145000}
		 ,{'inittime':150000, 'initimg': 24, 'endtime':163000}
		 ,{'inittime':157000, 'initimg': 25, 'endtime':163000}
		 ,{'inittime':168000, 'initimg':  8, 'endtime':180000}
		 ,{'inittime':180000, 'initimg': 23, 'endtime':210000}
		 ,{'inittime':200000, 'initimg': 26, 'endtime':230000}
		 ,{'inittime':220000, 'initimg': 27, 'endtime':250000}
	];
	scheduled_subtitles = [
		  {'inittime':     0, 'endtime':  5700, 'text':'*silence*'} 
		 ,{'inittime':  5700, 'endtime': 41500, 'text':'*static noise*'} 
		 //,{'inittime': 15000, 'endtime': 21000, 'text':'*weird crackling*'}
		 //,{'inittime': 21000, 'endtime': 41500, 'text':'*static noise*'} 
		 ,{'inittime': 41500, 'endtime': 46000, 'text':'*synth pads*'} 
		 //,{'inittime': 46000, 'endtime': 51000, 'text':'*static noise*'} 
		 ,{'inittime': 51000, 'endtime': 53000, 'text':'*mechanical animal growling*'} 
		 //,{'inittime': 53000, 'endtime': 57000, 'text':'*static noise*'} 
		 ,{'inittime': 57000, 'endtime': 62000, 'text':'*synth pads*'} 
		 ,{'inittime': 70000, 'endtime': 72000, 'text':'*dogs barking*'} 
		 //,{'inittime': 74000, 'endtime': 80000, 'text':'*static noise*'} 
		 ,{'inittime': 72000, 'endtime': 78000, 'text':'*synth pads*'} 
		 ,{'inittime': 83200, 'endtime': 86000, 'text':'*computer mouse clicking*'} 

		 ,{'inittime':100000, 'endtime':110000, 'text':'and then we were on another plane'}
		 ,{'inittime':110000, 'endtime':120000, 'text':'with a strict realization, a sense of fulfillment'}
		 ,{'inittime':120000, 'endtime':130000, 'text':'the dust smelled of lavender soap'}
		 ,{'inittime':130000, 'endtime':140000, 'text':'a morphed path formed itself in front of us'}
		 ,{'inittime':140000, 'endtime':150000, 'text':'there was a glow and there was no shame'}
		 ,{'inittime':150000, 'endtime':160000, 'text':'no caution, no suspicion of any sort or kind'}
		 ,{'inittime':160000, 'endtime':170000, 'text':'and we could be ourselves again'}
		 ,{'inittime':170000, 'endtime':180000, 'text':'i spent that whole day wandering the open fields'}
		 ,{'inittime':180000, 'endtime':190000, 'text':'until i found it at the edge of an oasis'}
		 ,{'inittime':190000, 'endtime':200000, 'text':'our revelation, our purpose'}
		 ,{'inittime':200000, 'endtime':210000, 'text':'hidden well deep underneath your soul'}
		 ,{'inittime':210000, 'endtime':220000, 'text':'that last broken heart piece, that is now fading...'}
		 ,{'inittime':220000, 'endtime':230000, 'text':'he is smiling at me'}
	];

	//subtitles "static signal " "dogs barking" "notes playing"
	
	backgroundAudio.start(0, 0);
	init_time = (new Date()).getTime();
	drawCanvas();
}

function backToStartScreen(){
	let dom = document.getElementById('starter_menu');
	if (dom) {//dom.parentNode.removeChild(dom);
		dom.style.display = "block";
	}
	initAudio(function(){});
}

document.addEventListener("keydown", keyDownTextField, false);

function keyDownTextField(e) {
	if (sync_stuff == false) return;
	var keyCode = e.keyCode;
	console.log(keyCode);

	switch(keyCode) {
		case 32: // space
			//init_time = (new Date()).getTime();
			if (skip == false) {
				enterSkip();
			} else {
				initAudio(function(){
						skip = false;
						init_time = (new Date()).getTime() - skip_timer;
						backgroundAudio.start(0, skip_timer/1000);
					});
			}
		break;
	}

}

function enterSkip() {
	skip_timer = (new Date()).getTime() - init_time;
	backgroundAudio.stop();
	backgroundAudio = undefined;
	skip = true;
}

var skip = false;
var skip_timer = 0;

window.addEventListener("wheel", function(e) {
	if (sync_stuff == false) return;
    //var dir = Math.sign(e.deltaY);
    //console.log(dir + ' ' + e.deltaY);
	if (skip == false) {
		enterSkip();
	}
	skip_timer += -e.deltaY;
	if (skip_timer < 0) skip_timer = 0;
});
