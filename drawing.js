	// SETTING ALL VARIABLES

    const stempSizeSuppressor = 25;
    
    var isMouseDown = false;
    var isDragMode = false;
    var isFuzzMode = false;
    var isRandomStamp = false;
    var isBackgroundMode = false;

    var canvas = document.createElement('canvas');
    var gcanvas = document.createElement('canvas');
    var bgcanvas = document.createElement('canvas');
    var ocanvas = document.createElement('canvas');
    var container = document.getElementById('canvasContainer');
    var historyBoard = document.getElementById('historyBoard');
    var foregroundImage = document.getElementById('foreImage');
    var backgroundImage = document.getElementById('backImage');
    var symbols = document.querySelectorAll('#asset ul li img');
    var ctx = canvas.getContext('2d');
    var gctx = gcanvas.getContext('2d');
    var bgctx = bgcanvas.getContext('2d');
    var octx = ocanvas.getContext('2d');
    var actionArray = [];
    var undoCount = 0;
    var currentStampSize = 25;
    var currentDragDistance = 25;
    var currentFuzziness = 1;
    var currentColor = "rgb(200,20,100)";
    var currentBg = "white";
    var currentSymbol = document.getElementById('currentSymbol');
    var currentCanvasSizeX = parseInt(document.getElementById("sizeX").value);
    var currentCanvasSizeY = parseInt(document.getElementById("sizeX").value);
    var lastSymbolPosition = { x: 0, y: 0 };



    // INIT
    createBackgroundCanvas();
    createForegroundCanvas();    
    createCanvas();
    createOverlayCanvas();
    

    // EVENT HANDLERS
    document.getElementById('bgcolorpicker').addEventListener('change', function() {
        ctx.fillStyle = this.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        redraw();
        currentBg = ctx.fillStyle;
    });

    document.getElementById('controlStampSize').addEventListener('change', function() {
        currentStampSize = this.value;
        document.getElementById("showStampSize").innerHTML = this.value;
    });

    document.getElementById('controlDragDistance').addEventListener('change', function() {
        currentDragDistance = this.value;
        document.getElementById("showDragDistance").innerHTML = this.value;
    });

    document.getElementById('sizeX').addEventListener('change', function(){
        document.getElementById("showCanvasXSize").innerHTML = this.value;
        currentCanvasSizeX = this.value;
        createBackgroundCanvas();
        createForegroundCanvas();    
        createCanvas();
        createOverlayCanvas();
        redraw();
    });

    document.getElementById('sizeY').addEventListener('change', function(){
        document.getElementById("showCanvasYSize").innerHTML = this.value;
        currentCanvasSizeY = this.value;
        createBackgroundCanvas();
        createForegroundCanvas();    
        createCanvas();
        createOverlayCanvas();
        redraw();
    });

    document.getElementById('isFuzziness').addEventListener('change', function() {
        isFuzzMode = this.checked;
    });

    document.getElementById('isDragMode').addEventListener('change', function() {
        isDragMode = this.checked;
    });

    document.getElementById('isBackMode').addEventListener('change', function() {
        isBackgroundMode = this.checked;
    });

    document.getElementById('undoButton').addEventListener('click', function() {
        undo();
    });

    document.getElementById('redoButton').addEventListener('click', function() {
        redo();
    });

    document.getElementById('saveToImage').addEventListener('click', function() {
        downloadCanvas(this, 'canvas', 'map.png');
    }, false);

    document.getElementById('clearHistory').addEventListener('click', function() {
        clearHistoryBoard();
        actionArray = [];
        undoCount = 0;
        console.log("History Cleared!");
    });

    symbols.forEach( symbol => {
        symbol.addEventListener('click', function(){
            setCurrentSymbol(this);
        })
    })

    // document.getElementById('eraser').addEventListener('click', eraser);
    // document.getElementById('clear').addEventListener('click', createCanvas);
    document.getElementById('save').addEventListener('click', save);
    document.getElementById('load').addEventListener('click', load);
    document.getElementById('clearCache').addEventListener('click', function() {
        localStorage.removeItem("savedCanvas");
        actionArray = [];
        console.log("Cache cleared!");
    });    

    // AUTO DRAW
    function autoDraw(length) {
        var rangedArray = getActiveRange(length);
        var sceneArray = sortAction(rangedArray);
        for (var i = 0; i < length; i++) {
            let scene = sceneArray[i];
            if(scene.act == ctx.drawImage) {
                let symbol = new Image();
                symbol.src = scene.src;
                ctx.drawImage(symbol, scene.px, scene.py, scene.sx, scene.sy);
            }
        }
    }

    // GET ACTIVE RANGE
    function getActiveRange(length) {
        var range = [];
        for (var i=0; i < length; i++) {
            range.push(actionArray[i]);
        }
        return range;
    }

    // SORT ARRAY BY POSITION Y
    function sortAction(array) {
        var arr = array;
        arr.sort(function (a, b) {
            if(a.py + a.sy > b.py + b.sy) {
                return 1;
            }
            if(a.py + a.sy < b.py + b.sy) {
                return -1;
            }
            return 0;
        })
        return arr;
    }

    // REDRAW
    function redraw() {
        autoDraw(actionArray.length);
    }

    // SET CURRENT SYMBOL
    function setCurrentSymbol(symbol) {
        currentSymbol.src = symbol.src;
    }

    // UNDO
    function undo(index) {
        console.log(`undostart : ${actionArray.length}`)
        if(undoCount >= actionArray.length) {
            console.log('Nothing to redo');
            return;
        }        
        ctx.clearRect(0, 0, canvas.width, canvas.height);   
        if(index != null) {
            autoDraw(index + 1);
            undoCount = actionArray.length - index - 1;            
        } else {
            autoDraw(actionArray.length-(undoCount+1))
            undoCount++;        
        }                
        console.log(`undoend: ${actionArray.length}`);
        console.log(`undocnt: ${undoCount}`);
    }

    // REDO
    function redo() {
        if(undoCount == 0) {
            console.log('Nothing to redo');
            return;
        }
        createCanvas();
        autoDraw(actionArray.length - (undoCount-1));
        undoCount--;
    }    

    // CANVAS EVENT HANDLERS
    ocanvas.addEventListener('mousedown', event => { mousedown(event); });
    ocanvas.addEventListener('mousemove', event => { mousemove(event); });    
    ocanvas.addEventListener('mouseleave', () => { mouseleave(); });
    ocanvas.addEventListener('mouseup', mouseup);    

    // CREATE BACKGROUND CANVAS
    function createBackgroundCanvas() {        
        bgcanvas.id = "bgcanvas";
        bgcanvas.width = currentCanvasSizeX;
        bgcanvas.height = currentCanvasSizeY;
        bgcanvas.style.zIndex = 6;
        bgcanvas.style.position = "absolute";
        bgcanvas.style.top = 0;
        bgcanvas.style.left = 0;
        var img = new Image();
        img.src = backgroundImage.src;
        img.onload = function() {
             bgctx.drawImage(img, 0, 0);
             container.appendChild(bgcanvas);
        };       
    }

    // CREATE FOREGROUND CANVAS
    function createForegroundCanvas() {
        // GROUND CANVAS        
        gcanvas.id = "gcanvas";
        gcanvas.width = currentCanvasSizeX;
        gcanvas.height = currentCanvasSizeY;
        gcanvas.style.zIndex = 7;
        gcanvas.style.position = "absolute";
        gcanvas.style.top = 0;
        gcanvas.style.left = 0;
        var img = new Image();
        img.src = foregroundImage.src;
        img.onload = function() {
             gctx.drawImage(img, 0, 0);
             container.appendChild(gcanvas);
        };       
    }

    // CREATE CANVAS
    function createCanvas() {
        // CANVAS        
        canvas.id = "canvas";
        canvas.width = currentCanvasSizeX;
        canvas.height = currentCanvasSizeY;
        canvas.style.zIndex = 8;
        canvas.style.position = "absolute";
        canvas.style.top = 0;
        canvas.style.left = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);   
        container.appendChild(canvas);        
    }     


    // CREATE OVERLAY CANVAS
    function createOverlayCanvas() {
        ocanvas.id="ocanvas";
        ocanvas.width = currentCanvasSizeX;
        ocanvas.height = currentCanvasSizeY;
        ocanvas.style.zIndex = 9;
        ocanvas.style.position = "absolute";
        ocanvas.style.top = 0;
        ocanvas.style.left = 0;
        ocanvas.style.opacity = 0.4;
        octx.clearRect(0, 0, ocanvas.width, ocanvas.height);        
        container.appendChild(ocanvas);
    }

    // DOWNLOAD CANVAS
    function downloadCanvas(link, canvas, filename) {
        link.href = document.getElementById(canvas).toDataURL();
        link.download = filename;
    }

    // SAVE FUNCTION
    // function save() {
    //     localStorage.removeItem("savedCanvas");
    //     localStorage.setItem("savedCanvas", JSON.stringify(actionArray));
    //     console.log("Saved canvas!");
    // }

    // LOAD FUNCTION
    // function load() {
    //     if (localStorage.getItem("savedCanvas") != null) {
    //         actionArray = JSON.parse(localStorage.savedCanvas);
    //         redraw();
    //         console.log("Canvas loaded.");
    //     }
    //     else {
    //         console.log("No canvas in memory!");
    //     }
    // }

    // ERASER HANDLING
    // function eraser() {
    //     currentStampSize = 50;
    //     currentColor = ctx.fillStyle
    // }

    // GET MOUSE POSITION
    function getMousePos(evt) {
        var stempSize = getStempSize();
        return {
            x: evt.offsetX - (stempSize.x / 2),
            y: evt.offsetY - (stempSize.y / 2)
        };
    }

    // ON MOUSE DOWN
    function mousedown(evt) {        
        isMouseDown = true
        if(isBackgroundMode) {
            stampBackground(evt);
            return;
        }
        stampSymbol(evt);
    }

    // ON MOUSE MOVE
    function mousemove(evt) {        
        if(isMouseDown){
            let currentPosition = getMousePos(evt);
            if(isBackgroundMode) {
                stampBackground(evt);
            } else {
                if(isDragMode) {
                    if(Math.abs(lastSymbolPosition.x - currentPosition.x) > currentDragDistance || Math.abs(lastSymbolPosition.y - currentPosition.y) > currentDragDistance) {
                        stampSymbol(evt);                                
                    }                
                }            
            }            
        }     
        overlayBrush(evt);
    }

    function stampBackground(evt) {
        let currentPosition = getMousePos(evt);
        let stempSize = getStempSize();
        var w = 800;
        var ida = gctx.getImageData(0,0,w,800);

        /*
              *
             ***
            *****
             ***
              *

        */
       var ssssss = [[false,false,true,false,false]
                     [false,true,true,true,false],
                     [true,true,true,true,true],
                     [false,true,true,true,false],
                     [false,false,true,false,false]];     


       

        for(var i = 0;i<5;i++){
            for(var ii = 0;ii<5;ii++){
                var a18 = (((i+currentPosition.y)*w)+currentPosition.x+ii)*4;

                if(ssssss[i][ii]){
                    ida.data[a18+3] = 0;
                }

                
            }
        }

        gctx.putImageData(ida,0,0);

    }

    // STAMP SYMBOL
    function stampSymbol(evt) {
        let currentPosition = getMousePos(evt);
        let stempSize = getStempSize();
        let action = { act: ctx.drawImage, px: currentPosition.x, py: currentPosition.y, sx: stempSize.x, sy: stempSize.y, src:currentSymbol.src }
        store(action);
        if(isDragMode) {
            preserveLastPosition(currentPosition);
        };
        createCanvas();
        autoDraw(actionArray.length);
    }

    // PRESERVE LAST POSITION
    function preserveLastPosition(pos) {
        lastSymbolPosition = pos;
        console.log(lastSymbolPosition);
    }

    // OVERLAY BRUSH
    function overlayBrush(evt) {
        let currentPosition = getMousePos(evt);
        let stempSize = getStempSize();
        octx.clearRect(0, 0, currentCanvasSizeX, currentCanvasSizeY);
        octx.drawImage(currentSymbol, currentPosition.x, currentPosition.y, stempSize.x, stempSize.y);
    }


    // ON MOUSE LEAVE
    function mouseleave() {
        octx.clearRect(0, 0, currentCanvasSizeX, currentCanvasSizeY);
    }

    // STAMP SIZE
    function getStempSize() {        
        var fuzzInt
        if(isFuzzMode) {
            fuzzInt = Math.random() + 1;
        } else {
            fuzzInt = 1;
        }
        return {
            x:currentSymbol.width*(currentStampSize/stempSizeSuppressor)*fuzzInt,
            y:currentSymbol.height*(currentStampSize/stempSizeSuppressor)*fuzzInt             
        }
    }

    // ON MOUSE UP
    function mouseup() {
        isMouseDown = false
    }

        // STORE ACTION
    function store(action) {
        if(undoCount != 0) {
            var tempArray = [];
            for(var i = 0; i<actionArray.length - undoCount; i++) {
                tempArray.push(actionArray[i]);
            }            
                actionArray = tempArray;
            };
        actionArray.push(action);
        undoCount = 0;
        drawHistory(actionArray);
        console.log(`store : ${actionArray.length}`)
    }

    function drawHistory(actionArray) {
        clearHistoryBoard();
        actionArray.forEach( function(action, index) {
            historyBoard.appendChild(buildHistory(action, index));            
        })
    }

    function clearHistoryBoard(){
        while (historyBoard.hasChildNodes()) {
            historyBoard.removeChild(historyBoard.firstChild);
        }
    }

    function buildHistory(action, index){
        let temp = document.getElementById("temp_history");
        let clone = document.importNode(temp.content, true);
        historyStack = clone.querySelector('.stack');
        historyName = clone.querySelector('.name');
        historyImage = clone.querySelector('.img');

        historyStack.addEventListener('click', () => {            
            updateHistoryView(index);        
            undo(index);
        })        
        historyName.innerHTML = `STAMP ADDED, Y : ${action.py+action.sy}`;                
        historyImage.src = action.src;
        return clone;
    }

    function updateHistoryView(index) {
        var list = document.querySelectorAll('.stack');            
        list.forEach( stack => {
            stack.classList.remove('active');
            stack.classList.remove('pending');
        });
        list[index].classList.add('active');
        for(var i = index + 1; i < actionArray.length; i++) {
            list[i].classList.add('pending');
        }
    }


