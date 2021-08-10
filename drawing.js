	// SETTING ALL VARIABLES

    const stempSizeSuppressor = 25;
    const baseURL = "http://3.36.74.100:9999/asset/"
    const baseImageRoot = "https://d2a797flmdiqkv.cloudfront.net/"
    
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
    var undoButton = document.getElementById('undoButton');
    var redoButton = document.getElementById('redoButton');
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
    var currentSymbol = document.getElementById('currentSymbol');
    var currentCanvasSizeX = parseInt(document.getElementById("sizeX").value);
    var currentCanvasSizeY = parseInt(document.getElementById("sizeX").value);
    var lastSymbolPosition = { x: 0, y: 0 };



    // INIT
    drawAsset()
    createBackgroundCanvas();
    createForegroundCanvas();    
    createCanvas();
    createOverlayCanvas();
    
    

    // EVENT HANDLERS
    document.addEventListener('keydown', function(event){
        if(event.ctrlKey && event.key === 'z') {
            undo();
        }
        if(event.ctrlKey && event.key === 'y') {
            redo();
        }
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

    undoButton.addEventListener('click', function() {
        undo();
    });

    redoButton.addEventListener('click', function() {
        redo();
    });

    document.getElementById('historyCloseButton').addEventListener('click', function() {
        document.getElementById('history').style.right = "-324px";
        document.getElementById('historyNavButton').style.display = 'block';
    })

    document.getElementById('assetCloseButton').addEventListener('click', function() {
        document.getElementById('asset').style.display = "none";        
    })

    document.getElementById('historyNavButton').addEventListener('click', function(){
        document.getElementById('history').style.right = "0px";
        this.style.display = 'none';
    })

    

    document.getElementById('saveToImage').addEventListener('click', function() {
        downloadCanvas(this, 'canvas', 'map.png');
    }, false);

    document.getElementById('clearHistory').addEventListener('click', function() {
        clearHistoryBoard();
        actionArray = [];
        undoCount = 0;
        console.log("History Cleared!");
    });

    currentSymbol.addEventListener('click', function(){
        document.getElementById('asset').style.display = 'block';
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
        createCanvas();
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
        currentSymbol.src = symbol.target.src;
    }

    // UNDO
    function undo(index) {
        console.log(`undostart : ${actionArray.length}`)
        if(undoCount >= actionArray.length) {
            console.log('Nothing to undo');
            return;
        }           
        if(index != null) {
            autoDraw(index + 1);
            undoCount = actionArray.length - index - 1;            
        } else {
            autoDraw(actionArray.length- (undoCount + 1))
            undoCount++;        
        }                
        updateUndoButtons();
        updateHistoryView(actionArray.length - undoCount - 1);
    }

    // REDO
    function redo() {
        console.log(`redo undocnt ${undoCount}`);
        if(undoCount == 0) {
            console.log('Nothing to redo');
            return;
        }   
        autoDraw(actionArray.length - undoCount + 1);
        undoCount--;
        updateUndoButtons();
        updateHistoryView(actionArray.length - undoCount - 1);
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
       var ssssss = [[false,false,true,false,false],
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
        if(isDragMode) {
            lastSymbolPosition = currentPosition;
        };
        let action = { act: ctx.drawImage, px: currentPosition.x, py: currentPosition.y, sx: stempSize.x, sy: stempSize.y, src:currentSymbol.src }
        store(action);
        autoDraw(actionArray.length);
    }

    // PRESERVE LAST POSITION
    function preserveLastPosition(pos) {
        lastSymbolPosition = pos;
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
    }

    // DRAW HISTORY
    function drawHistory(actionArray) {
        clearHistoryBoard();
        actionArray.forEach( function(action, index) {
            historyBoard.appendChild(cloneHistory(action, index));            
        });
        updateUndoButtons();
        updateHistoryView(actionArray.length - 1);
    }

    // DRAW ASSET
    function drawAsset() {        
        let assetBoard = document.getElementById('assetBoard');        
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function() {
            if(httpRequest.readyState == XMLHttpRequest.DONE) {
                if(httpRequest.status === 200) {
                    var data = JSON.parse(httpRequest.responseText);
                    var keys = Object.keys(data);
                    for(i = 0; i < keys.length; i++) {
                        let d1 = data[keys[i]];
                        let d1Keys = Object.keys(d1);
                        for(ii=0; ii < d1Keys.length; ii++) {
                            d1[d1Keys[ii]].forEach( function(ele){
                                assetBoard.appendChild(cloneAsset(ele.name));
                            })
                        }
                    }                    
                } else {
                    // TODO : ERROR
                    console.log('somethings wrong');
                }                
            } else {          
                // REQUEST FAIL      
                console.log('request fail');
            }
        };
        httpRequest.open('GET', baseURL, true);
        httpRequest.send();
    }

    // UPDATE UNDO & REDO BUTTONS
    function updateUndoButtons(){
        undoButton.classList.remove('active');
        redoButton.classList.remove('active');

        if(actionArray.length == 0) {
            return;
        }
        
        if(actionArray.length != undoCount) {
            undoButton.classList.add('active');
        };
        if(undoCount > 0) {
            redoButton.classList.add('active');
        }
    }

    // CLAER HISTORY BOARD
    function clearHistoryBoard(){
        while (historyBoard.hasChildNodes()) {
            historyBoard.removeChild(historyBoard.firstChild);
        }        
    }

    // CLONE HISTORY
    function cloneHistory(action, index){
        let temp = document.getElementById("temp_history");
        let clone = document.importNode(temp.content, true);
        historyStack = clone.querySelector('.stack');
        historyDesc = clone.querySelector('.desc');
        historyImage = clone.querySelector('.img');

        historyStack.addEventListener('click', () => {
            undoCount = actionArray.length - index - 1;           
            updateHistoryView(index);        
            undo(index);
        })        
        historyDesc.innerHTML = `STAMP ADDED, X : ${action.px + action.sx}, Y : ${action.py + action.sy}`;                
        historyImage.src = action.src;
        return clone;
    }

    // CLONE ASSET
    function cloneAsset(src){
        let temp = document.getElementById("temp_asset");
        let clone = document.importNode(temp.content, true);
        assetImage = clone.querySelector('img');
        assetImage.src = `${baseImageRoot}${src}`;
        assetImage.addEventListener('click', event => {
            setCurrentSymbol(event);
            document.getElementById('asset').style.display = "none";
        })        
        return clone;
    }

    // UPDATE HISTORY VIEW    
    function updateHistoryView(index) {
        var list = document.querySelectorAll('.stack');            
        list.forEach( stack => {
            stack.classList.remove('active');
            stack.classList.remove('pending');
        });
        if(index == -1) {
            list.forEach( stack => {
                stack.classList.add('pending');
            });
            return;
        }
        list[index].classList.add('active');
        for(var i = index + 1; i < actionArray.length; i++) {
            list[i].classList.add('pending');
        }        
    }


