function createElement(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
}

function calculateRect(startX, startY, endX, endY) {
    let widthRaw = Math.abs(endX - startX);
    let heightRaw = Math.abs(endY - startY);

    let width = (endX > startX) ? Math.ceil(widthRaw / 5) * 5 : Math.floor(widthRaw / 5) * 5;
    let height = (endY > startY) ? Math.ceil(heightRaw / 5) * 5 : Math.floor(heightRaw / 5) * 5;

    return {
        startX: (endX > startX) ? startX : startX - width,
        startY: (endY > startY) ? startY : startY - height,
        width,
        height
    };
}


function handleMouseDown(e, canvas) {
    Object.assign(canvas, {
        startX: e.offsetX,
        startY: e.offsetY,
        isDrawing: true,
        rectWidth: 0,
        rectHeight: 0
    });
}

function handleMouseMove(e, canvas, ctx) {
    if (!canvas.isDrawing) return;
    
    canvas.rectWidth = e.offsetX - canvas.startX;
    canvas.rectHeight = e.offsetY - canvas.startY;
    
    const { startX, startY, width, height } = calculateRect(canvas.startX, canvas.startY, e.offsetX, e.offsetY);
    
    canvas.hintsCtx.strokeStyle = "red";
    canvas.hintsCtx.clearRect(0, 0, canvas.hintsCanvas.width, canvas.hintsCanvas.height);
    canvas.hintsCtx.strokeRect(startX, startY, width, height);
    
    canvas.hintsCtx.font = "22px Unifont";
    canvas.hintsCtx.strokeStyle = "white";
    canvas.hintsCtx.strokeText(`${width} x ${height}`, startX + 5, startY + 15);
    canvas.hintsCtx.fillStyle = "black";
    canvas.hintsCtx.fillText(`${width} x ${height}`, startX + 5, startY + 15);
}

function handleMouseUp(canvas, ctx, row, hintsCanvas) {
    if (!canvas.isDrawing) return;
    canvas.isDrawing = false;
    canvas.hintsCtx.clearRect(0, 0, hintsCanvas.width, hintsCanvas.height);
    
    const { startX, startY, width, height } = calculateRect(canvas.startX, canvas.startY, canvas.startX + canvas.rectWidth, canvas.startY + canvas.rectHeight);
    if (width === 0 || height === 0) return;
    
    const imgData = ctx.getImageData(startX, startY, width, height);
    const newCanvas = createElement("canvas");
    
    Object.assign(newCanvas, { width, height, isCropped: true });
    newCanvas.getContext("2d").putImageData(imgData, 0, 0);
    
    row.replaceChildren(newCanvas);
    setupCanvasEventListeners(newCanvas, newCanvas.getContext("2d"), row);
}

function handleDragStart(e) {
    e.dataTransfer.setData("text/plain", "drag");
}

function handleDrop(e, canvas, ctx) {
    e.preventDefault();
    if (e.dataTransfer.getData("text/plain") !== "drag") return;
    
    ctx.strokeStyle = "red";
    ctx.strokeRect(e.offsetX, e.offsetY, 100, 100);
    canvas.hintsCtx?.drawImage(canvas, 0, 0);
}

function setupCanvasEventListeners(canvas, ctx, row) {
    const hintsCanvas = createElement("canvas", { class: "hint" });
    Object.assign(hintsCanvas, { width: canvas.width, height: canvas.height });
    
    row.appendChild(hintsCanvas);
    Object.assign(canvas, { hintsCanvas, hintsCtx: hintsCanvas.getContext("2d"), ctx });
    canvas.hintsCtx.strokeStyle = "red";
    
    canvas.addEventListener("mousedown", e => handleMouseDown(e, canvas));
    canvas.addEventListener("mousemove", e => handleMouseMove(e, canvas, ctx));
    canvas.addEventListener("mouseup", () => handleMouseUp(canvas, ctx, row, hintsCanvas));
    canvas.addEventListener("dragstart", handleDragStart);
    canvas.addEventListener("dragover", e => e.preventDefault());
    canvas.addEventListener("drop", e => handleDrop(e, canvas, ctx));
}

document.addEventListener("paste", e => {
    e.preventDefault();
    for (const item of e.clipboardData.items) {
        if (!item.type.includes("image")) continue;
        
        const blob = item.getAsFile();
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            const row = createElement("div", { class: "row" });
            const canvas = createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            Object.assign(canvas, { width: img.width, height: img.height, isCropped: false });
            ctx.drawImage(img, 0, 0);
            row.appendChild(canvas);
            document.getElementById("app").appendChild(row);
            setupCanvasEventListeners(canvas, ctx, row);
        };
    }
});
