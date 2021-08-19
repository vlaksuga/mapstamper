

    const VERSION = 1.2
    const SUPPRESS_VALUE = 25
    const BASE_API_URL = "https://baul-dev.com/"
    const ASSET_PATH = "asset/"
    // const BASE_IMAGE_ROOT = "https://chacha-image.s3.ap-northeast-2.amazonaws.com/"    
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
    var rcanvas = document.createElement('canvas')

    var ctx = canvas.getContext('2d')
    var gctx = gcanvas.getContext('2d')
    var bgctx = bgcanvas.getContext('2d')
    var octx = ocanvas.getContext('2d')
    var rctx = rcanvas.getContext('2d')

    var container = document.getElementById('canvasContainer')
    var historyBoard = document.getElementById('historyBoard')
    var textureHistoryBoard = document.getElementById('textureHistoryBoard')
    
    var undoButton = document.getElementById('undoButton')
    var redoButton = document.getElementById('redoButton')
    var symbolHistoryButton = document.getElementById('symbolHistory')
    var textureHistoryButton = document.getElementById('textureHistory')
    var symbols = document.querySelectorAll('#asset ul li img')
    

    var actionArray = []
    var pathArray = []
    var pathRawArray = []
    var symbolUndoCount = 0
    var textureUndoCount = 0
    
    var currentStampSize = 25
    var currentDragDistance = 25
    var currentVertices = 5
    var currentFuzziness = 1

    var currentSymbol = document.getElementById('currentSymbol')
    var currentForeImage = document.getElementById('foreImage')
    var currentBackImage = document.getElementById('backImage')

    var currentGrupId = "ag_love"
    var currentAssetTarget = currentSymbol
    var currentCanvasSizeX = parseInt(document.getElementById("sizeX").value)
    var currentCanvasSizeY = parseInt(document.getElementById("sizeY").value)
    var lastSymbolPosition = { x: 0, y: 0 }

    console.log(`VER : ${VERSION}`)

    // INIT
    getAssets()
    createBackgroundCanvas();
    createForegroundCanvas();    
    createCanvas();
    createOverlayCanvas();
    

    
    document.addEventListener('keydown', function(event){
        if(event.ctrlKey && event.key === 'z') {
            undoButton.click()
        }
        if(event.ctrlKey && event.key === 'y') {
            redoButton.click()
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


    document.getElementById('controlVertices').addEventListener('change', function() {
        currentVertices = this.value;
        document.getElementById("showVertices").innerHTML = this.value;
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
        console.log(`sizeY : ${this.value}`)
        document.getElementById("showCanvasYSize").innerHTML = this.value;
        currentCanvasSizeY = this.value;
        createBackgroundCanvas();
        createForegroundCanvas();    
        createCanvas();
        createOverlayCanvas();
        redraw();
    });

    document.getElementById('isRandomStamp').addEventListener('change', function() {
        isRandomStamp = this.checked;
    });

    document.getElementById('isFuzziness').addEventListener('change', function() {
        isFuzzMode = this.checked;
    });

    document.getElementById('isDragMode').addEventListener('change', function() {
        isDragMode = this.checked;
    });

    document.getElementById('isBackMode').addEventListener('change', function() {
        isBackgroundMode = this.checked
        if(isBackgroundMode) {
            canvas.classList.add('active')
            textureHistoryButton.click()
        } else {
            canvas.classList.remove('active')
            symbolHistoryButton.click()
        }        
    })
    
    undoButton.addEventListener('click', function() {
        if(document.querySelector('.historyTabButton.active').dataset.btn == 1) {
            undo()
        } else {
            undoTexture()
        }        
    })

    redoButton.addEventListener('click', function() {
        if(document.querySelector('.historyTabButton.active').dataset.btn == 1) {
            redo()
        } else {
            redoTexture()
        }        
    })

    symbolHistoryButton.addEventListener('click', function(){
        selectHistoryType(this.id)      
    })

    textureHistoryButton.addEventListener('click', function(){
        selectHistoryType(this.id)
    })

    document.getElementById('historyCloseButton').addEventListener('click', function() {
        document.getElementById('history').style.right = "-324px";
        document.getElementById('historyNavButton').style.display = 'block';
    })

    document.getElementById('assetCloseButton').addEventListener('click', function() {
        document.getElementById('asset').style.display = "none"
    })

    document.getElementById('historyNavButton').addEventListener('click', function(){
        document.getElementById('history').style.right = "0px"
        this.style.display = 'none'
    })

    

    document.getElementById('saveToImage').addEventListener('click', function() {
         downloadCanvas()
    }, false)

    document.getElementById('clearHistory').addEventListener('click', function() {
        clearHistoryBoard()
        actionArray = []
        symbolUndoCount = 0
        console.log("History Cleared!")
    });

    currentSymbol.addEventListener('click', function() {
        currentAssetTarget = currentSymbol
        showAssetPanel('stamp')
    })

    currentForeImage.addEventListener('click', function() {
        currentAssetTarget = currentForeImage
        showAssetPanel('texture')
    })

    currentBackImage.addEventListener('click', function() {
        currentAssetTarget = currentBackImage
        showAssetPanel('texture')
    })

    document.getElementById('save').addEventListener('click', save)
    document.getElementById('load').addEventListener('click', function(){
        document.getElementById('fileInput').click()
    })


    function showAssetPanel(t) {
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


    function autoDraw(length) {
        createCanvas()
        var rangedArray = getActiveRange(length, actionArray)
        var sceneArray = sortAction(rangedArray)
        sceneArray.forEach( scene => {
            ctx.drawImage(document.getElementById(scene.aid), scene.px, scene.py, scene.sx, scene.sy)
        })
    }

    // AUTO DRAW
    function autoDrawTexture(length) {
        createForegroundCanvas()
        var rangedArray = getActiveRange(length, pathArray)
        var path = new Path2D()
        rangedArray.forEach( scene => {
            path.addPath(scene)
        })
        gctx.clip(path, "nonzero")
        gctx.drawImage(currentForeImage, 0, 0) 
    }

    // GET ACTIVE RANGE
    function getActiveRange(length, array) {
        var range = [];
        for (var i=0; i < length; i++) {
            range.push(array[i]);
        }
        return range;
    }

    // SORT ARRAY BY POSITION Y
    function sortAction(array) {
        var arr = array              
        arr.sort(function (a, b) {
            if(a.py + a.sy > b.py + b.sy) {
                return 1;
            }
            if(a.py + a.sy < b.py + b.sy) {
                return -1;
            }
            return 0;
        })
        return arr
    }

    // REDRAW
    function redraw() {
        autoDraw(actionArray.length);
        autoDrawTexture(pathArray.length);
    }

    // SET CURRENT SYMBOL
    function setCurrentSymbol(symbol) {
        var parent = symbol.target.parentNode.parentNode
        if(parent.parentNode.dataset.atype != "texture") {
            currentGrupId = parent.id
        }
        console.log(currentGrupId)
        currentAssetTarget.src = symbol.target.src
        currentAssetTarget.dataset.aid = symbol.target.id
        if(currentAssetTarget.id == "foreImage") {
            autoDrawTexture(pathArray.length)      
        }
        if(currentAssetTarget.id == "backImage") {
            createBackgroundCanvas()
        }
    }

    // UNDO
    function undo(index) {
        if(symbolUndoCount >= actionArray.length) {
            console.log('Nothing to undo');
            return;
        }           
        if(index != null) {
            autoDraw(index + 1);
            symbolUndoCount = actionArray.length - index - 1;            
        } else {
            autoDraw(actionArray.length- (symbolUndoCount + 1))
            symbolUndoCount++;        
        }                
        updateUndoButtons(actionArray, historyBoard);
        updateHistoryView(actionArray.length - symbolUndoCount - 1, historyBoard);
    }

    // UNDO
    function undoTexture(index) {
        if(textureUndoCount >= pathArray.length) {
            console.log('Nothing to undo')
            return
        }           
        if(index != null) {        
            autoDrawTexture(index + 1)
            textureUndoCount = pathArray.length - index - 1
        } else {
            autoDrawTexture(pathArray.length - (textureUndoCount + 1))
            textureUndoCount++
        }                
        updateUndoButtons(pathArray, textureHistoryBoard)
        updateHistoryView(pathArray.length - textureUndoCount - 1, textureHistoryBoard)
    }

    // REDO
    function redo() {
        console.log(`redo undocnt ${symbolUndoCount}`);
        if(symbolUndoCount == 0) {
            console.log('Nothing to redo')
            return
        }   
        autoDraw(actionArray.length - symbolUndoCount + 1)
        symbolUndoCount--
        updateUndoButtons(actionArray, historyBoard)
        updateHistoryView(actionArray.length - symbolUndoCount - 1, historyBoard)
    }
    
    // REDO
    function redoTexture() {
        console.log(`redo undocnt ${textureUndoCount}`)
        if(textureUndoCount == 0) {
            console.log('Nothing to redo')
            return
        }   
        autoDrawTexture(pathArray.length - textureUndoCount + 1)
        textureUndoCount--
        updateUndoButtons(pathArray, textureHistoryBoard)
        updateHistoryView(pathArray.length - textureUndoCount - 1, textureHistoryBoard)
    }

    // CANVAS EVENT HANDLERS
    ocanvas.addEventListener('mousedown', event => { mousedown(event) })
    ocanvas.addEventListener('mousemove', event => { mousemove(event) })    
    ocanvas.addEventListener('mouseleave', () => { mouseleave() })
    document.addEventListener('mouseup', mouseup)

    // CREATE BACKGROUND CANVAS
    function createBackgroundCanvas() {        
        bgcanvas.id = "bgcanvas"
        bgcanvas.width = currentCanvasSizeX
        bgcanvas.height = currentCanvasSizeY
        bgcanvas.style.zIndex = 6
        bgcanvas.style.position = "absolute"
        bgcanvas.style.top = 0
        bgcanvas.style.left = 0
        var img = new Image()
        img.src = currentBackImage.src
        img.addEventListener('load', function(){
            console.log('back img loaded')
            bgctx.drawImage(currentBackImage, 0, 0);
            container.appendChild(bgcanvas);
        })
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
        container.appendChild(gcanvas);
    }   

    // CREATE CANVAS
    function createCanvas() {
        canvas.id = "canvas";
        canvas.width = currentCanvasSizeX;
        canvas.height = currentCanvasSizeY;
        canvas.style.zIndex = 9;
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
        ocanvas.style.zIndex = 10;
        ocanvas.style.position = "absolute";
        ocanvas.style.top = 0;
        ocanvas.style.left = 0;
        ocanvas.style.opacity = 0.4;
        octx.clearRect(0, 0, ocanvas.width, ocanvas.height);        
        container.appendChild(ocanvas);
    }

    // CREATE RESULT CANVAS
    function createResultCanvas() {
        rcanvas.id = "rcanvas";
        rcanvas.width = currentCanvasSizeX;
        rcanvas.height = currentCanvasSizeY;
        rcanvas.style.zIndex = 12;
        rcanvas.style.position = "absolute";
        rcanvas.style.top = 0;
        rcanvas.style.left = 0;
        rctx.clearRect(0, 0, rcanvas.width, rcanvas.height);   
        container.appendChild(rcanvas);        
    }     

    
    function downloadCanvas() {
        createResultCanvas()
        mergeCanvas(bgcanvas)
        .then(msg => mergeCanvas(gcanvas))
        .then(msg => mergeCanvas(canvas))
        .then(msg => saveToImageFile())
    }

    function mergeCanvas(canvas) {
        return new Promise(resolve => {
            const canvasImage = new Image()
            canvasImage.src = canvas.toDataURL()
            canvasImage.onload = () => {
                rctx.drawImage(canvasImage, 0, 0, currentCanvasSizeX, currentCanvasSizeY)
                console.log(`${canvas.id} merged!`)
                resolve(`${canvas.id} merged!`)
            }
        })        
    }

    function saveToImageFile() { 
        const a = document.createElement('a')
        a.href = rcanvas.toDataURL()
        a.download = "map.png"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        console.log('file created!')
        rcanvas.parentNode.removeChild(rcanvas)
    }
    



    function save() {    
        const a = document.createElement("a")                
        const settings = { atype: "setting", canvasWidth: currentCanvasSizeX, canvasHeight: currentCanvasSizeY, foreTexture: document.getElementById('foreImage').dataset.aid, backTexture: document.getElementById('backImage').dataset.aid }
        const symbols = { atype : "symbol",  contents : actionArray } 
        const paths = { atype : "path",  contents : pathRawArray } 
        const obj = { settings: settings, symbols: symbols, paths: paths }
        a.href = URL.createObjectURL(new Blob([JSON.stringify(obj)], {type: "text/plain; charset=utf-8"}))
        a.setAttribute("download", "data.json")
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    function load(e) {
        const file = e.target.files[0];
        console.log(file);
        if(!file) {            
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const obj = JSON.parse(e.target.result)
            const settings = obj.settings
            const symbols = obj.symbols
            const paths = obj.paths            

            updateCurrentArrays(symbols, paths)
            updateSettings(settings)            
            reInit()
        };
        reader.readAsText(file);    
    }

    function reInit() {
        createBackgroundCanvas()
        createForegroundCanvas()
        createCanvas()
        createOverlayCanvas()
        redraw()
        drawHistory(actionArray, historyBoard);
        drawHistory(pathArray, textureHistoryBoard);
        symbolUndoCount = 0
        textureUndoCount = 0
    }

    
    function updateCurrentArrays(action, raw) {
        actionArray = action.contents
        pathRawArray = raw.contents        
        const newPath = []
        for(i=0; i < pathRawArray.length; i++) {                                
            const currentPath = new Path2D()        
            const startPos = { x: pathRawArray[i].sp.x, y: pathRawArray[i].sp.y }
            currentPath.moveTo(startPos.x, startPos.y)
            for(ii = 0; ii < pathRawArray[i].mp.length; ii++) {                    
                const insPos = { x: pathRawArray[i].mp[ii].x, y: pathRawArray[i].mp[ii].y }
                currentPath.lineTo(insPos.x, insPos.y)
            }                           
            currentPath.closePath()             
            newPath.push(currentPath)   
        } 
        pathArray = newPath
    }

    function updateSettings(settings) {
        // TODO : RESTORE CANVAS SIZE
        const foreImageSrc = document.getElementById(settings.foreTexture).src
        const backImageSrc = document.getElementById(settings.backTexture).src
        document.getElementById('foreImage').src = foreImageSrc
        document.getElementById('backImage').src = backImageSrc
    }

    // GET MOUSE POSITION
    function getMousePos(evt) {
        let stempSize = getStempSize();
        return {
            x: evt.offsetX - (stempSize.x / 2),
            y: evt.offsetY - (stempSize.y / 2)
        };
    }

    // ON MOUSE DOWN
    function mousedown(evt) {        
        isMouseDown = true
        if(isBackgroundMode) {
            stampTexture(evt);
            return;
        }
        stampSymbol(evt);
    }

    // ON MOUSE MOVE
    function mousemove(evt) {
        if(isMouseDown){
            let currentPosition = getMousePos(evt);
            if(isDragMode) {
                if(isBackgroundMode) {
                    stampTexture(evt);
                } else {
                    if(Math.abs(lastSymbolPosition.x - currentPosition.x) > currentDragDistance || Math.abs(lastSymbolPosition.y - currentPosition.y) > currentDragDistance) {
                        stampSymbol(evt);                                
                    }                
                }                
            }            
        }     
        overlayBrush(evt);
    }

    // GET CURRENT PATH
    function getCurrentPath(x, y, p) {
        var currentPath = new Path2D()        
        var points = p
        var size = currentStampSize        
        var startPos = { x: x + size * Math.sin(0), y: y + size * Math.cos(0) }
        var movePos = []
        currentPath.moveTo(startPos.x, startPos.y)
        for(i = 1; i <= points; i++) {
            var insPos = {x: x + size * Math.sin(i * 2 * Math.PI / points), y: y + size * Math.cos(i * 2 * Math.PI / points)}
            currentPath.lineTo(insPos.x, insPos.y)
            movePos.push(insPos)
        }                
        currentPath.closePath()
        return { path: currentPath, raw: { sp: startPos, mp: movePos } }
    }
    



    // STAMP SYMBOL
    function stampSymbol(evt) {        
        let currentPosition = getMousePos(evt);
        let stempSize = getStempSize();
        if(isDragMode) {
            lastSymbolPosition = currentPosition;
        };
        let action = { actType: "drawStamp", px: currentPosition.x, py: currentPosition.y, sx: stempSize.x, sy: stempSize.y, aid: currentSymbol.dataset.aid }
        storeAction(action);
        autoDraw(actionArray.length);
        if(isRandomStamp) {   
            changeCurrentStamp(currentGrupId)
        }
    }

    function stampTexture(evt) {
        createForegroundCanvas()
        var path = getCurrentPath(evt.offsetX, evt.offsetY, currentVertices)
        storePath(path)
        autoDrawTexture(pathArray.length)
    }

    function changeCurrentStamp(groupId) {
        var group = document.getElementById(groupId)
        var stamps = group.querySelectorAll('img')
        var symbol = stamps[Math.floor(Math.random()*stamps.length)]
        currentSymbol.src = symbol.src;
        currentSymbol.dataset.aid = symbol.id;
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
            var path = getCurrentPath(evt.offsetX, evt.offsetY, currentVertices).path
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
    function storeAction(action) {
        if(symbolUndoCount != 0) {
            var tempArray = [];
            for(var i = 0; i < actionArray.length - symbolUndoCount; i++) {
                tempArray.push(actionArray[i]);
            }            
                actionArray = tempArray;
            };
        actionArray.push(action);
        symbolUndoCount = 0;
        drawHistory(actionArray, historyBoard);                      
    }

    // STORE 
    function storePath(obj) {
        if(textureUndoCount != 0) {
            var tempPathArray = []
            var tempRawArray = []
            for(var i = 0; i < pathArray.length - textureUndoCount; i++) {
                tempPathArray.push(pathArray[i])
            }                        
            pathArray = tempPathArray
            for(var i = 0; i < pathRawArray.length - textureUndoCount; i++) {
                tempRawArray.push(pathRawArray[i])
            }
            pathRawArray = tempRawArray
            }
        pathArray.push(obj.path)
        pathRawArray.push(obj.raw)
        textureUndoCount = 0
        drawHistory(pathArray, textureHistoryBoard)
    }

    // DRAW HISTORY
    function drawHistory(array, board) {        
        clearHistoryBoard(board);
        array.forEach( function(action, index) {
            board.appendChild(cloneHistory(action, index, board));            
        });
        updateUndoButtons(array, board);
        updateHistoryView(array.length - 1, board);
    }


    function getAssets() {                
        fetch(BASE_API_URL + ASSET_PATH).then(function(response){
            console.log('fectch success')
            return response.json()
        }).then(function(data){            
            assetData = data
            console.log('update asset Data')
            drawAssets()            
        }).catch(function(err){
            console.warn('error!!', err)
        })        
    }

    function drawAssets() {
        const assetBoard = document.getElementById('assetBoard');
        const keys = Object.keys(assetData);
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
    }

    function updateUndoButtons(array, board) {
        undoButton.classList.remove('active');
        redoButton.classList.remove('active');
        if(board == historyBoard) {
            if(array.length == 0 || array.length == undefined) {
                return;
            }            
            if(array.length != symbolUndoCount) {
                undoButton.classList.add('active');
            };
            if(symbolUndoCount > 0) {
                redoButton.classList.add('active');
            }            
        } else {
            if(array.length == 0 || array.length == undefined) {
                return;
            }
            if(array.length != textureUndoCount) {
                undoButton.classList.add('active');
            }
            if(textureUndoCount > 0) {
                redoButton.classList.add('active');
            }          
        }        
    }

    function clearHistoryBoard(board){
        while (board.hasChildNodes()) {
            board.removeChild(board.firstChild);
        }               
    }


    function cloneHistory(action, index, board) {
        let temp = document.getElementById("temp_history")
        let clone = document.importNode(temp.content, true)
        historyStack = clone.querySelector('.stack')
        historyDesc = clone.querySelector('.desc')
        historyImage = clone.querySelector('.img')
        
        if(board == historyBoard) {
            historyStack.addEventListener('click', () => {            
                symbolUndoCount = actionArray.length - index - 1
                updateHistoryView(index, board);        
                undo(index);
            })        
            historyImage.src = document.getElementById(action.aid).src
            historyDesc.innerHTML = "STAMP ADDED"
        } else {
            historyStack.addEventListener('click', () => {            
                textureUndoCount = pathArray.length - index - 1
                updateHistoryView(index, board);        
                undoTexture(index);
            })
        }           
        return clone
    }


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

    function cloneAssetGroup(keyName){
        let temp = document.getElementById("temp_asset_group");
        let clone = document.importNode(temp.content, true);
        grouptitle = clone.querySelector('h5')
        grouptitle.innerHTML = keyName
        groupList = clone.querySelector('ul')
        groupList.id = `ag_${keyName}`  
        return clone;
    }


    function cloneAsset(ele){
        let temp = document.getElementById("temp_asset")
        let clone = document.importNode(temp.content, true)
        let id =`asset_${ele.name.split('.')[0]}`
        assetImage = clone.querySelector('img')
        assetImage.id = id
        assetImage.src = `${BASE_IMAGE_ROOT}${ele.name}`
        assetImage.crossOrigin = 'Anonymous'
        assetImage.addEventListener('click', event => {            
            setCurrentSymbol(event);
            document.getElementById('asset').style.display = "none"
        })        
        return clone
    }

    function updateHistoryView(index, board) {
        var array
        if (board == historyBoard) {
            array = actionArray
        } else {
            array = pathArray
        }
        var list = board.querySelectorAll('.stack')
        list.forEach( stack => {
            stack.classList.remove('active')
            stack.classList.remove('pending')
        });
        if(index == -1) {
            list.forEach( stack => {
                stack.classList.add('pending')
            })
            return
        }
        list[index].classList.add('active')
        for(var i = index + 1; i < array.length; i++) {
            list[i].classList.add('pending')
        }
    }

    function selectHistoryType(sid) {
        var tabNum = document.getElementById(sid).dataset.btn
        var selectedBoard
        document.querySelectorAll('.historyTabButton').forEach( button => {
            button.classList.remove('active');
            if(button.id == sid) { button.classList.add('active') }
        })
        document.querySelectorAll('.historyBoard').forEach( board => {
            board.style.display = "none"
            if(board.dataset.tab == tabNum) {
                 board.style.display = "block"
                 selectedBoard = board
            }
        })
        var array
        if( tabNum == "1") { array = actionArray} else { array = pathArray}
        updateUndoButtons(array, selectedBoard)
    }