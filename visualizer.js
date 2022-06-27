var analyser;
var freqData;
var canvas;
var draw;
var cX;
var cY;
last = (new Date()).getTime();
function add(a,b) {return a+b}
function randomNum(max, min = 0) { return Math.random() * (max-min) + min; }
freezeCircle = false;
var circleX;
var circleY;

function toggleCircle() {
  if (!freezeCircle) {freezeCircle = true}
  else {freezeCircle = false}
}

function toggleTab(menu) {
  var inverse = {"": "block", "block": ""}
  document.getElementById(menu).style.display = inverse[document.getElementById(menu).style.display];
}

function useMp3(files) {
  var file = files[0]
  var fileUrl = URL.createObjectURL(file)
  try { player.pause() } catch (e) {}
  player = new Audio(fileUrl)
  player.loop = true
  document.getElementById("mp3").value = ""
  setup("file")
}

function createContext(thing) {
  try {
    var time = thing.currentTime
    player = thing.cloneNode();
    player.currentTime = time
    thing = player;
  } catch (e) {}

  var flag = false;
  try {sourceNode.disconnect(); context.close()} catch (e) {}
  context = new AudioContext();
  context.muted = true;
  try { sourceNode = context.createMediaStreamSource(thing); }
  catch (e){ try {sourceNode = context.createMediaElementSource(thing); var flag = true; player.muted = false; player.play();} catch (e) {context.connect(sourceNode)}}
  analyser = context.createAnalyser();
  sourceNode.connect(analyser)
  if (flag) {analyser.connect(context.destination)}
  analyser.fftSize = Math.pow(2, document.getElementById("barNum").value)
  freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqData);
  update()
}

function setup(source="microphone") {
  sum = 0
  num = 0
  currentSource = source;
  canvas = document.getElementById("canvas");
  canvas.width = wrapper.offsetWidth;
  canvas.height = wrapper.offsetHeight;
  draw = canvas.getContext("2d")
  draw.clearRect(0,0,canvas.width,canvas.height)
  draw.fillStyle = "rgb(38,38,38)"
  draw.fillRect(0, 0, canvas.width,canvas.height)
  wrapper = document.getElementById("wrapper")
  if (source == "microphone") {
    try { player.pause(); player = undefined; }
    catch (e) {}
    navigator.mediaDevices.getUserMedia({video: false, audio: true}).then(createContext)
  } else {
    createContext(player)
  }
  document.body.addEventListener('mousemove', setCursor);
  document.body.addEventListener("mouseup", toggleCircle)
}
function update() {
  if ((new Date()).getTime()-last > 5000 && document.getElementById("options").style.display == "") {document.getElementById("tabs").className = "hidden"}
  canvas.width = wrapper.offsetWidth;
  canvas.height = wrapper.offsetHeight;
  if (analyser.fftSize != Math.pow(2, document.getElementById("barNum").value)) {
    setup(currentSource)
  }
  analyser.fftSize = Math.pow(2, document.getElementById("barNum").value)
  analyser.getByteFrequencyData(freqData);
  draw.clearRect(0,0,canvas.width,canvas.height)
  draw.fillStyle = "rgb(38,38,38)"
  draw.fillRect(0, 0, canvas.width,canvas.height)
  if (document.getElementById("lines").checked) {
    drawLines()
  }
  if (document.getElementById("bars").checked) {
    drawBars()
  }
  if (document.getElementById("circles").checked) {
    drawCursor()
  }  requestAnimationFrame(update)
}

function getMousePos(canvas, evt) {
  var rectangle = canvas.getBoundingClientRect();
  return {
    x: evt.clientX-rectangle.left,
    y: evt.clientY-rectangle.top
  };
}

function setCursor(evt) {
  document.getElementById("tabs").className = "shown"
  last = (new Date()).getTime();
  cX = getMousePos(canvas, evt).x
  cY = getMousePos(canvas, evt).y
}

function drawCursor() {
  if (!freezeCircle) {
    circleX = cX;
    circleY = cY;
  }
  draw.fillStyle = "white"
  for (i in freqData) {
    draw.strokeStyle=color(freqData[i])
    draw.beginPath()
    draw.arc(circleX, circleY, freqData[i]/1.2, 0, 2*Math.PI)
    draw.closePath()
    draw.stroke()
  }
}

function drawLines() {
  for (var i = 0; i < freqData.length; i++) {
    if (freqData[i] != 0) {
      draw.beginPath()
      draw.strokeStyle = color(freqData[i])
      draw.moveTo(canvas.width-freqData[i]/255*1.2*canvas.width, 0);
      draw.lineTo(canvas.width-freqData[i]/255*1.2*canvas.width, canvas.height)
      draw.stroke()
    }
  }
}

function drawBars() {
  var barWidth = Math.floor(canvas.width/analyser.frequencyBinCount)
  for (i in freqData) {
    draw.fillStyle=color(freqData[i])
    draw.fillRect(i*(barWidth+2),canvas.height,barWidth,-freqData[i]*(canvas.height/255))
  }
}

//Get color from single value
function color(i) {
  order = document.getElementById("colorSelect").value;
  var colorStage = 0
  var r = 255
  var b = 0
  var g = 0
  for (var c = 0; c < i*order[3]; c += 1) {
    if (colorStage == 0) {
      if (g < 255) {
        g++
      } else {
        colorStage = 1
      }
    } else if (colorStage == 1) {
      if (r > 0) {
        r--
      } else {
        colorStage = 2
      }
    } else if (colorStage == 2) {
      if (b < 255) {
        b++
      } else {
        colorStage = 3
      }
    } else if (colorStage == 3) {
      if (g > 0) {
        g--
      } else {
        colorStage = 4
      }
    } else if (colorStage == 4) {
      if (r < 255) {
        r++
      } else {
        colorStage = 5
      }
    } else if (colorStage == 5) {
      if (b > 0) {
        b--
      } else {
        colorStage = 0
      }
    }
  }
  colors = {r: r, b: b, g: g}
  return "rgb("+colors[order[0]]+","+colors[order[1]]+","+colors[order[2]]+")"
}
