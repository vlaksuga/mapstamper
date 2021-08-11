	// SETTING ALL VARIABLES

    const SUPPRESS_VALUE = 25
    const BASE_API_URL = "http://3.36.74.100:9999/"
    const ASSET_PATH = "asset/"
    const BASE_IMAGE_ROOT = "https://d2a797flmdiqkv.cloudfront.net/"
    
    var isMouseDown = false
    var isDragMode = false
    var isFuzzMode = false
    var isRandomStamp = false
    var isBackgroundMode = false

    var assetData
    var canvas = document.createElement('canvas')
    var gcanvas = document.createElement('canvas')
    var bgcanvas = document.createElement('canvas')
    var ocanvas = document.createElement('canvas')
    var container = document.getElementById('canvasContainer')
    var historyBoard = document.getElementById('historyBoard')
    var currentForeImage = document.getElementById('foreImage')
    var currentBackImage = document.getElementById('backImage')
    var undoButton = document.getElementById('undoButton')
    var redoButton = document.getElementById('redoButton')
    var symbols = document.querySelectorAll('#asset ul li img')
    var ctx = canvas.getContext('2d')
    var gctx = gcanvas.getContext('2d')
    var bgctx = bgcanvas.getContext('2d')
    var octx = ocanvas.getContext('2d')
    var actionArray = []
    var pathArray = []
    var undoCount = 0
    var currentStampSize = 25
    var currentDragDistance = 25
    var currentFuzziness = 1
    var currentSymbol = document.getElementById('currentSymbol')
    var currentAssetTarget = currentSymbol
    var currentCanvasSizeX = parseInt(document.getElementById("sizeX").value)
    var currentCanvasSizeY = parseInt(document.getElementById("sizeX").value)
    var lastSymbolPosition = { x: 0, y: 0 }



    // INIT
    getAssets()
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

    document.getElementById('fileInput').addEventListener('change', load, false);

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

    

    // document.getElementById('saveToImage').addEventListener('click', function() {
    //     downloadCanvas(this, 'canvas', 'map.png');
    // }, false);

    document.getElementById('clearHistory').addEventListener('click', function() {
        clearHistoryBoard();
        actionArray = [];
        undoCount = 0;
        console.log("History Cleared!");
    });

    currentSymbol.addEventListener('click', function(event) {
        currentAssetTarget = currentSymbol
        showAssetPanel(event, 'stamp');
    })

    currentForeImage.addEventListener('click', function(event) {
        showAssetPanel(event, 'texture');
    })

    currentBackImage.addEventListener('click', function(event) {
        showAssetPanel(event, 'texture');
    })

    // document.getElementById('eraser').addEventListener('click', eraser);
    // document.getElementById('clear').addEventListener('click', createCanvas);
    document.getElementById('save').addEventListener('click', save);
    document.getElementById('load').addEventListener('click', function(){
        document.getElementById('fileInput').click();
    });
    document.getElementById('clearCache').addEventListener('click', function() {
        localStorage.removeItem("savedCanvas");
        actionArray = [];
        console.log("Cache cleared!");
    });    

    // SHOW ASSET PANEL
    function showAssetPanel(event, t) {
        currentAssetTarget = event.target
        console.log(currentAssetTarget)
        var view = document.getElementById('asset')
        view.querySelector('.title').innerHTML = t
        cats = view.querySelectorAll('.assetCatContainer')
        cats.forEach( cat => {
            cat.style.display = 'none';
            if(cat.dataset.atype == t) {
                cat.style.display = 'block';
            }
        })
        view.style.display = 'block'
    }

    // AUTO DRAW
    function autoDraw(length) {
        createCanvas();
        var rangedArray = getActiveRange(length);
        var sceneArray = sortAction(rangedArray);
        for (var i = 0; i < length; i++) {
            let scene = sceneArray[i];
            if(scene.actType == "drawStamp") {
                ctx.drawImage(document.getElementById(scene.aid), scene.px, scene.py, scene.sx, scene.sy);
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
        currentAssetTarget.src = symbol.target.src;
        currentAssetTarget.dataset.aid = symbol.target.id;
        if(currentAssetTarget.id != "currentSymbol") {
            createBackgroundCanvas()
            createForegroundCanvas()            
        }
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
    document.addEventListener('mouseup', mouseup);    

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
        img.src = currentBackImage.src;
        img.onload = function() {
             bgctx.drawImage(img, 0, 0);
             container.appendChild(bgcanvas);
        };       
    }

    // CREATE FOREGROUND CANVAS
    function createForegroundCanvas() { 
        gcanvas.id = "gcanvas";
        gcanvas.width = currentCanvasSizeX;
        gcanvas.height = currentCanvasSizeY;
        gcanvas.style.zIndex = 7;
        gcanvas.style.position = "absolute";
        gcanvas.style.top = 0;
        gcanvas.style.left = 0;
        var img = new Image();
        img.src = currentForeImage.src;
        img.onload = function() {
             container.appendChild(gcanvas);
             clipBackgroundPath()
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
    function save() {    
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(actionArray)], {type: "text/plain; charset=utf-8"}));        
        a.setAttribute("download", "data.json");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // LOAD FUNCTION
    function load(e) {
        console.log('load invoke');
        var file = e.target.files[0];
        console.log(file);
        if(!file) {            
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            actionArray = JSON.parse(contents);            
            createCanvas();
            redraw();
            drawHistory(actionArray);
        };
        reader.readAsText(file);    
    }

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
        createForegroundCanvas()
        var path = getCurrentPath(evt) 
        pathArray.push(path)             
        clipBackgroundPath()
    }

    // CLIP BACKGROUND PATH
    function clipBackgroundPath(index) {
        if(pathArray.length != 0) {
            var initPath = pathArray[0]
            for(i=1; i < pathArray.length; i++){
                initPath.addPath(pathArray[i])
            }
            gctx.clip(initPath, "nonzero")
            gctx.drawImage(currentForeImage, 0, 0)
        }
    }

    // GET CURRENT PATH
    function getCurrentPath(evt) {
        var currentPath = new Path2D()
        let pos = { x: evt.offsetX, y: evt.offsetY }
        var angles = 10
        var size = currentStampSize
        var startInfo = { x: pos.x + size * Math.sin(0), y: pos.y + size * Math.cos(0)}
        currentPath.moveTo(startInfo.x, startInfo.y)
        for(i = 1; i <= angles; i++) {            
            var px = pos.x + currentStampSize * getRandomInt(1, 4) * Math.sin(i * 2 * Math.PI / angles)
            var py = pos.y + currentStampSize * getRandomInt(1, 4) * Math.cos(i * 2 * Math.PI / angles)
            var posInfo = {x: px, y: py}
            currentPath.lineTo(posInfo.x, posInfo.y)
        }
        currentPath.closePath()
        return currentPath
    }

    // GET RANDOM
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // STAMP SYMBOL
    function stampSymbol(evt) {
        
        let currentPosition = getMousePos(evt);
        let stempSize = getStempSize();
        if(isDragMode) {
            lastSymbolPosition = currentPosition;
        };
        let action = { actType: "drawStamp", px: currentPosition.x, py: currentPosition.y, sx: stempSize.x, sy: stempSize.y, aid: currentSymbol.dataset.aid }
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
        if(isBackgroundMode) {
            var path = getCurrentPath(evt)
            octx.stroke(path)
        } else {
            octx.drawImage(currentSymbol, currentPosition.x, currentPosition.y, stempSize.x, stempSize.y);     
        }                       
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
            x:currentSymbol.width*(currentStampSize/SUPPRESS_VALUE)*fuzzInt,
            y:currentSymbol.height*(currentStampSize/SUPPRESS_VALUE)*fuzzInt             
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

    // LOAD ASSET
    function getAssets() {

        let assetBoard = document.getElementById('assetBoard');        
        var httpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = function() {
            if(httpRequest.readyState == XMLHttpRequest.DONE) {
                if(httpRequest.status === 200) {
                    console.log('request success')
                    assetData = JSON.parse(httpRequest.responseText);
                    var keys = Object.keys(assetData);
                    for(i = 0; i < keys.length; i++) {                        
                        assetBoard.appendChild(cloneAssetCategory(keys[i]));
                        let d1 = assetData[keys[i]];
                        let d1Keys = Object.keys(d1);                        
                        for(ii=0; ii < d1Keys.length; ii++) {
                            document.getElementById(`ac_${keys[i]}`).appendChild(cloneAssetGroup(d1Keys[ii]));
                            d1[d1Keys[ii]].forEach( function(ele){
                                document.getElementById(`ag_${d1Keys[ii]}`).appendChild(cloneAsset(ele));
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

        httpRequest.open('GET', BASE_API_URL + ASSET_PATH, true);
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
        historyDesc.innerHTML = "STAMP ADDED";                
        historyImage.src = document.getElementById(action.aid).src;
        return clone;
    }

    // CLONE ASSET CATEGORY
    function cloneAssetCategory(catName) {
        let temp = document.getElementById("temp_asset_cat");
        let clone = document.importNode(temp.content, true);
        catTitle = clone.querySelector('h3');
        catTitle.innerHTML = catName;
        catContainer = clone.querySelector('div');
        catContainer.id = `ac_${catName}`;
        if(catName == "Texture") {
            catContainer.dataset.atype = 'texture';
        } else {
            catContainer.dataset.atype = 'stamp';
        }        
        return clone;
    }


    // CLONE ASSET GROUP
    function cloneAssetGroup(keyName){
        let temp = document.getElementById("temp_asset_group");
        let clone = document.importNode(temp.content, true);
        grouptitle = clone.querySelector('h5');
        grouptitle.innerHTML = keyName;
        groupList = clone.querySelector('ul');
        groupList.id = `ag_${keyName}`;        
        return clone;
    }

    // CLONE ASSET
    function cloneAsset(ele){
        let temp = document.getElementById("temp_asset");
        let clone = document.importNode(temp.content, true);
        let id =`asset_${ele.name.split('.')[0]}`;
        assetImage = clone.querySelector('img');
        assetImage.id = id;
        assetImage.src = `${BASE_IMAGE_ROOT}${ele.name}`;
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


