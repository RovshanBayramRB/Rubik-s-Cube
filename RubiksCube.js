//Defining Variables
var canvas, gl, program, 
//Handling
vPositionHandle, pMatrixHandle, mvMatrixHandle, vTextCoordHandle, 
//Views
aspect, near, far, eye, at, 
//Sizes
size, numMiniCubes, 
xStart, xEnd, yStart, yEnd, zStart, zEnd, rubikSize, miniCubeSize, 
//Texture Variables
colorTextures, 
//Variables for Checking if Texture Images are Loaded
RedLoaded, BlueLoaded, GreenLoaded, OrangeLoaded, WhiteLoaded, YellowLoaded, 
useColorTextures, 
//Mouse Controlling Variables
mouseDown, lastMouseX, lastMouseY, 
//Rotation Variables
cubeRotationMatrix, 
rotateDim, rotateIdx, rotateDir, 
rotateInProgress, lastRotateDim, lastRotateIdx, currRotateAmount, 
stepRotDegree, scrambling, 
fromLayer, 
rubikCube;

//Initializing Color Indices
const 
red = 0, 
green = 1, 
blue = 2, 
orange = 3, 
white = 4, 
yellow = 5;

//Initialzing Row, Column, Depth, and Up Vector
const 
row = 0, 
col = 1, 
dep = 2;
const up = vec3(0.0, 1.0, 0.0);

//Initialzing Code by size 3
window.onload = function init(){
	initialize(true, 3);
}

//Defining Initializing Function which will decide an object to be appearon the page
function initialize(textureChoice, sizeChoice){
	canvas = document.getElementById("gl-canvas");

	initGL(canvas);

    //Loading Shaders and Initializing Attribute Buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    initVars(textureChoice, sizeChoice);
    createHandles();
    initTextures();
    defineActionListeners();
    buildRubiksCube();
}

//Initializing Canvas
function initGL(canvas){
	gl = WebGLUtils.setupWebGL(canvas);
	if (gl == null){
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}
	gl.viewport(0, 0, canvas.width, canvas.height);
    //Setting Background Color to Black
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
}

//Defining Function for Initializing Global Variables
function initVars(textureChoice, sizeChoice){
	rubikCube = [], 
	//Initializing Size Variables
	//The starting point is the top left of the front layer
	xStart = -0.4, xEnd = 0.4, yStart = -0.4, yEnd = 0.4, zStart = 0.4, zEnd = -0.4, 
	//Setting Cube Size
	rubikSize = xEnd - xStart, 
	size = sizeChoice, numMiniCubes = Math.pow(size, 3), 
	miniCubeSize = rubikSize/size, 
	//Initializing Texture Variables
	colorTextures = [], 
	RedLoaded = false, BlueLoaded = false, GreenLoaded = false, 
	OrangeLoaded = false, WhiteLoaded = false, YellowLoaded = false, 
	useColorTextures = textureChoice, 
	//Initializing View Variables
	near = 0.1, 
	far = 10, 
	aspect = canvas.width/canvas.height, 
	eye = vec3(0,0, 2.5), 
	//(0, 0, 0) means looking into the center of the cube
	at = vec3(0, 0, 0), 
	//Initializing Mouse Controlling Variables
	mouseDown = false, 
	lastMouseX = null, 
	lastMouseY = null, 
	rotateInProgress = false, 
	currRotateAmount = 0, 
	stepRotDegree = 30, 
	fromLayer = false, 
	scrambling = false, 
	cubeRotationMatrix = mat4();
}

//Defining Function for Creating Handles for each Attribute and Unifrom Variables from the Shader
function createHandles(){
	vPositionHandle = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(vPositionHandle);

	vTextCoordHandle = gl.getAttribLocation(program, "vTextCoord");
	gl.enableVertexAttribArray(vTextCoordHandle);

    //Sending Model View camera/transformation Matrix Over
    mvMatrixHandle = gl.getUniformLocation(program, "mvMatrix");

    //Sending the Perspective Matrix Data Over
	pMatrixHandle = gl.getUniformLocation(program, "pMatrix");
	
    //Sending Data Over Exactly Once
    var pMat = perspective(45.0, aspect, near, far);
    gl.uniformMatrix4fv(pMatrixHandle, false, flatten(pMat));
}

//Initializing Textures and Loading Color or Texture Images
function initTextures(){
	//Loading Red Texture Image
	var redSticker = new Image();
	redSticker.onload = function() {
		colorTextures.push(configureTexture(redSticker));
		RedLoaded = true;
	}
	redSticker.src = "red.gif"

	//Loading Green Texture Image
	var greenSticker = new Image();
	greenSticker.onload = function() {
		colorTextures.push(configureTexture(greenSticker));
		GreenLoaded = true;
	}
	greenSticker.src = "green.gif"

	//Loading Blue Texture Image
	var blueSticker = new Image();
	blueSticker.onload = function() {
		colorTextures.push(configureTexture(blueSticker));
		BlueLoaded = true;
	}
	blueSticker.src = "blue.gif"

	//Loading Orange Texture Image
	var orangeSticker = new Image();
	orangeSticker.onload = function() {
		colorTextures.push(configureTexture(orangeSticker));
		OrangeLoaded = true;
	}
	orangeSticker.src = "orange.gif"

	//Loading White Texture Image
	var whiteSticker = new Image();
	whiteSticker.onload = function(){
		colorTextures.push(configureTexture(whiteSticker));
		WhiteLoaded = true;
	}
	whiteSticker.src = "white.gif"

	//Loading Yellow Texture Image
	var yellowSticker = new Image();
	yellowSticker.onload = function(){
		colorTextures.push(configureTexture(yellowSticker));
		YellowLoaded = true;
	}
	yellowSticker.src = "yellow.gif"
}

//Defining Function for Creating, Loading and Configuring Textures
function configureTexture(image){
	
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	//Using Nearest Filter Mode
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	//Cleaning Up
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
}

//Creating The Action Linsteners that is used throughout the Application
function defineActionListeners(){
    //Creating Handler for Layer Rotation
    document.onkeydown = function(){
    	var key = String.fromCharCode(event.keyCode);
    	if (event.shiftKey){ 
    		//Rotating Layer Around y
    		rotateDim = row;
    	}
    	else if (event.ctrlKey){ 
        	//Rotating Layer Around z
        	rotateDim = dep;
        }
        else{
        	//Rotating Layer Around x
        	rotateDim = col;
        }

        if (event.altKey){
        	//Changing the Direction of Rotation
        	rotateDir = 1;
        }
        else{
        	rotateDir = -1;
		}
		
		//Defining Cases
        switch (key){
			//N for New Cube
        	case "N":
        	launchNewRubiksCube(useColorTextures, size);
			break;
			//S for Scrabling or Chaning Color of the Cube
        	case "S":
        	if (!rotateInProgress){
        		scramble();
        		return;
        	}
			break;
			//Setting Rotation Information of the Cube by Size 3
        	rotateIdx = 2;
        	stepRotDegree = 30;
        	break;
        	default:
        	return;
        }
        fromLayer = true;
        render();
	}
	
	//Defining Functions for Mouse Controlling
	//It must be started Clicking on the Canvas for Rotation
    canvas.onmousedown = function(){
    	mouseDown = true;
    	lastMouseX = event.clientX;
    	lastMouseY = event.clientY;
    }

    document.onmouseup = function(){
    	mouseDown = false;
    }

	//After Clicking on the Canvas, Mouse can Move Everywhere on the Page
    document.onmousemove = function(){
    	if (!mouseDown){
    		return;
    	}
    	var newX = event.clientX;
    	var newY = event.clientY;

    	var deltaX = newX - lastMouseX;
    	var deltaY = newY - lastMouseY;
    	var newCubeRotationMatrix = mat4();

    	newCubeRotationMatrix = mult(newCubeRotationMatrix, rotate(deltaY/3.5, [1, 0, 0]));
    	newCubeRotationMatrix = mult(newCubeRotationMatrix, rotate(deltaX/3.5, [0, 1, 0]));
    	cubeRotationMatrix = mult(newCubeRotationMatrix, cubeRotationMatrix);

    	lastMouseX = newX
    	lastMouseY = newY;

    	fromLayer = false;
    	render();
    }
}

//Defining Function for Creating New Cube or Setting the Cube to its Initial Position
function launchNewRubiksCube(textureChoice, sizeChoice){
	initialize(textureChoice, sizeChoice);
}

//Defining Function for Scrambling or Changing Colors of the Cube
function scramble(){
	var randomIdx, randomDim;
	scrambling = true;

	for (var i = 0; i < 20; i++){
		randomIdx = Math.floor(Math.random()*(size)); // between 0 and 
		rotateIdx = randomIdx;
		randomDim = Math.floor(Math.random()*(2 + 1)); // between 0 and 2
		rotateDim = randomDim;
		stepRotDegree = 90;
		rotateInProgress = false;
		fromLayer = true;
		render();
	};
	lastRotateDim = rotateDim;
	lastRotateIdx = rotateIdx;
	stepRotDegree = 30;
	scrambling = false;
}

//Function to Build the Cube by Defining the Vertices of All 26 Cubes
function buildRubiksCube(){
	//Defining All Mini Cubes and Sending them to the Shader
	for (var dep = 0; dep < size; dep++){
		for (var row = 0; row < size; row++){
			for (var col = 0; col < size; col++){
				//Drawing Outer Cubes
				//loc is an Object which Contains Row, Column, and Depth
					var loc = {row: row, col: col, dep: dep};
					var cubePoints = [], cubeTexturePoints = [];
					var cubeCorners = defineMiniCube(loc);
					buildCube(cubePoints, cubeTexturePoints, cubeCorners);
					createBuffersAndSendDataToGPU(cubePoints, cubeTexturePoints, loc);
			}
		}
	}
	//Rendering All Mini Cubes 
	fromLayer = false;
	render();
}

//Defining Function for Building Mini Cube
function defineMiniCube(loc){
	//Defining the Corner Vertices of the Mini Cube at the Location of the Passed in Variable
	var xOff = loc.col*miniCubeSize, yOff = loc.row*miniCubeSize, zOff = loc.dep*miniCubeSize;

	//Defining and Returning Array of 8 vec3 Vertices which Defines the Corner of the Mini Cube
	var cubeCorners =
	[
	vec3(xStart + xOff, yEnd - miniCubeSize - yOff, zStart - zOff), 
	vec3(xStart + xOff, yEnd - yOff, zStart - zOff), 
	vec3(xStart + miniCubeSize + xOff, yEnd - yOff, zStart - zOff), 
	vec3(xStart + miniCubeSize + xOff, yEnd - miniCubeSize - yOff, zStart - zOff), 
	vec3(xStart + xOff, yEnd - miniCubeSize - yOff, zStart - miniCubeSize - zOff), 
	vec3(xStart + xOff, yEnd - yOff, zStart - miniCubeSize - zOff), 
	vec3(xStart + miniCubeSize + xOff, yEnd - yOff, zStart - miniCubeSize - zOff), 
	vec3(xStart + miniCubeSize + xOff, yEnd - miniCubeSize - yOff, zStart - miniCubeSize - zOff)
	];

	return cubeCorners;
}

//Defining Function to Build the Cube in Winding Order
function buildCube(cubePoints, cubeTexturePoints, cubeCorners){
	//Building All 6 Faces
	//cubePoints and cubeTexturePoints Variables are passed in by Reference
    buildFace(1, 0, 3, 2, cubePoints, cubeTexturePoints, cubeCorners);
    buildFace(2, 3, 7, 6, cubePoints, cubeTexturePoints, cubeCorners);
    buildFace(3, 0, 4, 7, cubePoints, cubeTexturePoints, cubeCorners);
    buildFace(6, 5, 1, 2, cubePoints, cubeTexturePoints, cubeCorners);
    buildFace(4, 5, 6, 7, cubePoints, cubeTexturePoints, cubeCorners);
    buildFace(5, 4, 0, 1, cubePoints, cubeTexturePoints, cubeCorners);
}

//Function for Building Faces of the Cube
function buildFace(tL, bL, bR, tR, cubePoints, cubeTexturePoints, cubeCorners){
	var textCoords = [
	vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(1, 0)
	];

    //Creating 12 Triples which are the Triangles in each Face of the Cube
    var cornerTriIdxs = [tL, bL, bR, tL, bR, tR];
    var textTriIdxs = [0, 1, 2, 0, 2, 3];

    for (var i = 0; i < cornerTriIdxs.length; ++i){
    	cubePoints.push(cubeCorners[cornerTriIdxs[i]]);
    	cubeTexturePoints.push(textCoords[textTriIdxs[i]]);
    }
}

//Creating the Buffer Objects for the Passed in Mini Cube
function createBuffersAndSendDataToGPU(cubePoints, cubeTexturePoints, loc){
	var cubeBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cubePoints), gl.STATIC_DRAW);

	//Storing Points which were Used for the Cube
	cubeBufferId.numVertices = cubePoints.length;

	var cubeTextureBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeTexturePoints), gl.STATIC_DRAW);
	cubeTextureBufferId.numVertices = cubeTexturePoints.length;

	var layerRotationMatrix = mat4();

    //Using a Global Object to Contain Buffers for each Mini Cube
    rubikCube.push({cubeBufferId: cubeBufferId, cubeTextureBufferId: cubeTextureBufferId, loc: loc, layerRotationMatrix: layerRotationMatrix});
}

//Checking if All Textures are Loaded
function allTexturesLoaded(){
	if (RedLoaded && GreenLoaded && BlueLoaded && OrangeLoaded && WhiteLoaded && YellowLoaded)
	{
		return true;
	}
	else{
		return false;
	}
}

//Function for Rotating Direction and Dimension of the Globals Using Stored Points, 
function updateLayerRotationMatrix(miniCube){
	var newLayerRotationMatrix = mat4();
	var temp;

	if (rotateDim == row){
		//Rotating Layer Around y
		newLayerRotationMatrix = mult(newLayerRotationMatrix, rotate(rotateDir*stepRotDegree, [0, 1, 0]));

		if (!rotateInProgress){
			//Update loc
			if (rotateDir < 0){
				temp = miniCube.loc.dep;
				miniCube.loc.dep = size - 1 - miniCube.loc.col;
				miniCube.loc.col = temp;
			}
			else{
				temp = miniCube.loc.col;
				miniCube.loc.col = size - 1 - miniCube.loc.dep;
				miniCube.loc.dep = temp;
			}
		}
	}
	else if (rotateDim == col){
		//Rotating Layer Around x
		newLayerRotationMatrix = mult(newLayerRotationMatrix, rotate(rotateDir*stepRotDegree, [1, 0, 0]));

		if (!rotateInProgress){
			// update loc
			if (rotateDir < 0){
				temp = miniCube.loc.dep;
				miniCube.loc.dep = size - 1 - miniCube.loc.row;
				miniCube.loc.row = temp;
			}
			else{
				temp = miniCube.loc.row;
				miniCube.loc.row = size - 1 - miniCube.loc.dep;
				miniCube.loc.dep = temp;
			}
		}
	}
	else{
		//Rotating Layer Around z
		newLayerRotationMatrix = mult(newLayerRotationMatrix, rotate(rotateDir*stepRotDegree, [0, 0, 1]));

		if (!rotateInProgress){
			//Updating loc
			if (rotateDir < 0){
				temp = miniCube.loc.col;
				miniCube.loc.col = size - 1 - miniCube.loc.row;
				miniCube.loc.row = temp;
			}
			else{
				temp = miniCube.loc.row;
				miniCube.loc.row = size - 1 - miniCube.loc.col;
				miniCube.loc.col = temp;
			}
		}
	}

    //Binding Axes to Cube
    miniCube.layerRotationMatrix = mult(newLayerRotationMatrix, miniCube.layerRotationMatrix);
}

//Function for Rendering
//It will be called whenever Something is Changed
function render(){
	//Waits until Textures are Loaded before Rendering Anything
	if (allTexturesLoaded()){
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var rotateAllowed = true;

		//Starts from Beginning each time
		var eyeMVMatrix = lookAt(eye, at, up);

		//Entire Rubik Rotation Happens to each Mini Cube
		var rubikRotation = mult(eyeMVMatrix, cubeRotationMatrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

		//Checking if the Rotation is Allowed
		if (fromLayer && !scrambling){
			if (rotateInProgress){
				//Checking if dim/idx Combination is Allowed
				if (rotateDim != lastRotateDim || rotateIdx != lastRotateIdx){
					rotateAllowed = false;
				}
			}
			else{
				rotateInProgress = true;
			}

			if (rotateAllowed){
				currRotateAmount += rotateDir*stepRotDegree;
				lastRotateDim = rotateDim;
				lastRotateIdx = rotateIdx;
				if (currRotateAmount == 90 || currRotateAmount == -90){
					rotateInProgress = false;
					currRotateAmount = 0;
				}
			}
		}

		//Drawing Each Cube
		for (var i = 0; i < numMiniCubes; i++) {
			if (fromLayer && rotateAllowed){
				var rotateMiniCube = false;
				if (rotateDim == row){
					if (rubikCube[i].loc.row == rotateIdx){
						rotateMiniCube = true;
					}
				}
				else if (rotateDim == col){
					if (rubikCube[i].loc.col == rotateIdx){
						rotateMiniCube = true;
					}
				}
				else{
					if (rubikCube[i].loc.dep == rotateIdx){
						rotateMiniCube = true;
					}
				}

				if (rotateMiniCube){
					//Updating the Layer Rotation Matrix Accordingly
					updateLayerRotationMatrix(rubikCube[i]);
				}
			}

			//Sending Over Model View Matrix which Contains New Data
			gl.uniformMatrix4fv(mvMatrixHandle, false, flatten(mult(rubikRotation, rubikCube[i].layerRotationMatrix)));

			//Binding Cube Vertex Buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, rubikCube[i].cubeBufferId);
			gl.vertexAttribPointer(vPositionHandle, 3, gl.FLOAT, false, 0, 0);

			//Binding Cube Texture Buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, rubikCube[i].cubeTextureBufferId);
			gl.vertexAttribPointer(vTextCoordHandle, 2, gl.FLOAT, false, 0, 0);

			//gl.bindBuffer means Binding Cube Texture Color Images
			//gl.drawArrays means Drawing Each Face
			//Both of them are done Individually
			gl.bindTexture(gl.TEXTURE_2D, colorTextures[red]);
			gl.drawArrays(gl.TRIANGLES, 0, rubikCube[i].cubeBufferId.numVertices/6);

			gl.bindTexture(gl.TEXTURE_2D, colorTextures[white]);
			gl.drawArrays(gl.TRIANGLES, 6, rubikCube[i].cubeBufferId.numVertices/6);

			gl.bindTexture(gl.TEXTURE_2D, colorTextures[blue]);
			gl.drawArrays(gl.TRIANGLES, 12, rubikCube[i].cubeBufferId.numVertices/6);

			gl.bindTexture(gl.TEXTURE_2D, colorTextures[green]);
			gl.drawArrays(gl.TRIANGLES, 18, rubikCube[i].cubeBufferId.numVertices/6);

			gl.bindTexture(gl.TEXTURE_2D, colorTextures[orange]);
			gl.drawArrays(gl.TRIANGLES, 24, rubikCube[i].cubeBufferId.numVertices/6);

			gl.bindTexture(gl.TEXTURE_2D, colorTextures[yellow]);
			gl.drawArrays(gl.TRIANGLES, 30, rubikCube[i].cubeBufferId.numVertices/6);
		}
	}
	else{
		fromLayer = false;
		window.requestAnimFrame(render);
	}
}