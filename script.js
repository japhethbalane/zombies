
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// init canvas

let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// init screen lock handling

let isScreenLocked = false;

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
document.addEventListener('click', test);
function test() {
    canvas.requestPointerLock();
};

document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;

document.addEventListener('pointerlockchange', pointLockChange, false);
document.addEventListener('mozpointerlockchange', pointLockChange, false);
document.addEventListener('webkitpointerlockchange', pointLockChange, false);

function pointLockChange(event) {
    isScreenLocked = !isScreenLocked;
    console.log('Screen Locked : ', isScreenLocked);
    if (isScreenLocked) {
        initializeEventListeners();
        cursor.reset();
    } else {
        destroyEventListeners();
    }
};

function initializeEventListeners() {
    document.removeEventListener('click', test);
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('contextmenu', contextMenuHandler);
};

function destroyEventListeners() {
    document.addEventListener('click', test);
    document.removeEventListener('keydown', keyDownHandler);
    document.removeEventListener('keyup', keyUpHandler);
    document.removeEventListener('mousedown', mouseDownHandler);
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('contextmenu', contextMenuHandler);
};

window.addEventListener('resize', () => {
     document.exitPointerLock();
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// init global variables

let dragBox = new DragBox();
let border = new Border();
let cursor = new Cursor();
let units = [];
let selectedUnits = [];

generateUnits();
function generateUnits() {
    for (let i = 0; i < 100; i++) {
        units.push(new Unit());
    }
};

let isShftDown = false;
let isCtrlDown = false;
let controledUnitsHotkeys = {};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// main loop

loop();
function loop() {
    context.fillStyle = 'rgba(255, 255, 255, 1)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (isScreenLocked) {
        for (let unit of units) {
            unit.update().draw();
        }

        cursor.update().draw();
        border.update().draw();
        dragBox.draw();
    }

    window.requestAnimationFrame(loop);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// support functions

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

function getHypothenuse(p1, p2) {
    let x = Math.abs(p1.x - p2.x);
    let y = Math.abs(p1.y - p2.y);
    return Math.sqrt((x * x) + (y * y));
};

function moveSelectedUnitsTo(x, y) {
    for (let unit of selectedUnits) {
        let action = {
            type: 'move',
            x: x,
            y: y
        };
        if (isShftDown) {
            unit.actions.push(action);
        } else {
            unit.actions = [action];
        }
    }
};

function getUnitsHit(vector) {
    let unitsHit = [];
    for (let unit of units) {
        if (getHypothenuse(unit, vector) <= unit.r) {
            unitsHit.push(unit);
        }
    }
    return unitsHit;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// objects

function Unit() {
    this.x = randomBetween(border.x, border.x + border.width);
    this.y = randomBetween(border.x, border.x + border.height);
    this.r = 10;
    this.speed = 5;
    this.prevX = this.x;
    this.prevY = this.y;
    this.currentAction = {type: 'move', x: this.x, y: this.y};
    this.actions = [this.currentAction];

    this.stopCurrentAction = () => {
        this.prevX = this.x;
        this.prevY = this.y;
        this.currentAction.x = this.x;
        this.currentAction.y = this.y;
        this.actions.shift();
    };

    this.update = () => {
        if (this.actions.length) {
            this.currentAction = this.actions[0];
        } else {
            this.updateSpacing(1);
            return this; // do nothing if no current action
        }

        if (this.x != this.currentAction.x || this.y != this.currentAction.y) {
            let adj = Math.abs(this.x - this.currentAction.x);
            let opp = Math.abs(this.y - this.currentAction.y);
            let hyp = getHypothenuse(this, {x: this.currentAction.x, y: this.currentAction.y});
            let angle;
            let dx = 0, dy = 0;

            if (this.currentAction.x <= this.x) {
                angle = Math.acos(adj / hyp);
                dx = -Math.cos(angle) * this.speed;
                if (this.currentAction.y >= this.y) {
                    dy = Math.sin(angle) * this.speed;
                } else {
                    dy = -Math.sin(angle) * this.speed;
                }
            } else {
                angle = Math.acos(adj / hyp);
                dx = Math.cos(angle) * this.speed;
                if (this.currentAction.y >= this.y) {
                    dy = Math.sin(angle) * this.speed;
                } else {
                    dy = -Math.sin(angle) * this.speed;
                }
            }

            if (hyp <= this.speed) {
                this.stopCurrentAction();
            } else {
                this.x += dx;
                this.y += dy;
                this.updateSpacing(5);
                this.updateBorderSpacing();
            }
        } else {
            this.updateBorderSpacing();
            this.stopCurrentAction();
        }

        if (Math.abs(this.x - this.prevX) < 0.001 && Math.abs(this.y - this.prevY) < 0.001) {
            this.currentAction.x = this.x;
            this.currentAction.y = this.y;
        }
        this.prevX = this.x;
        this.prevY = this.y;

        return this;
    };

    this.draw = () => {
        context.fillStyle = 'red';
        context.strokeStyle = 'red';
        context.beginPath();
        context.arc(this.x, this.y, this.r, Math.PI * 2, false);
        context.stroke();
        if (selectedUnits.includes(this)) {
            context.fill();
            for (let i = 0; i < this.actions.length; i++) {
                let action = this.actions[i];
                let prevAction = this.actions[i - 1] ? this.actions[i - 1] : {x: this.x, y: this.y};
                if (action.type == 'move') {
                    context.strokeStyle = 'rgba(0, 255, 0, 1)';
                    context.beginPath();
                    context.moveTo(prevAction.x, prevAction.y);
                    context.lineTo(action.x, action.y);
                    context.stroke();
                } else if (action.type == 'attack') {

                }
            }
        }
    };

    this.updateSpacing = (div) => {
        for (let unit of units) {
            if (this != unit) {
                if (this.x == unit.x && this.y == unit.y) {
                    this.x += randomBetween(-this.speed, this.speed + 1);
                    this.y += randomBetween(-this.speed, this.speed + 1);
                    unit.x += randomBetween(-unit.speed, unit.speed + 1);
                    unit.y += randomBetween(-unit.speed, unit.speed + 1);
                }

                let radiusSum = (this.r + unit.r) / div;
                let hyp = getHypothenuse(this, unit);

                if (radiusSum >= hyp) {
                    let diff_x = this.x - unit.x;
                    let diff_y = this.y - unit.y;
                    let dx = diff_x / hyp;
                    let dy = diff_y / hyp;

                    this.x = unit.x + (radiusSum) * dx || this.currentAction.x;
                    this.y = unit.y + (radiusSum) * dy || this.currentAction.y;
                }
            }
        }
    }; this.updateSpacing(1);

    this.updateBorderSpacing = () => {
        if (this.x - this.r < border.x) {
            this.x = this.r + border.x;
        } else if (this.x + this.r > border.x + border.width) {
            this.x = border.x + border.width - this.r;
        }
        if (this.y - this.r < border.y) {
            this.y = this.r + border.y;
        } else if (this.y + this.r > border.y + border.height) {
            this.y = border.y + border.height - this.r;
        }
    }; this.updateBorderSpacing();

    this.updatePositionRelativeToBorder = (x_move, y_move) => {
        this.x += x_move;
        this.y += y_move;
        for (let action of this.actions) {
            if (action.x && action.y) {
                action.x += x_move;
                action.y += y_move;
            }
        }
    };
};

function DragBox() {
    this.reset = function() {
        this.x = null;
        this.y = null;
        this.offx = null;
        this.offy = null;
    }; this.reset();
    this.draw = function() {
        if (this.x != null && this.offx != null) {
            context.fillStyle = 'rgba(255, 192, 203, 0.3)';
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineTo(this.offx, this.y);
            context.lineTo(this.offx, this.offy);
            context.lineTo(this.x, this.offy);
            context.lineTo(this.x, this.y);
            context.fill();
        }
    };
    this.setPosition = (x, y) => {
        this.x = x;
        this.y = y;
    };
    this.mouseMoveHandler = () => {
        selectedUnits = [];
        this.offx = cursor.x;
        this.offy = cursor.y;
        let lesserX = this.x;
        let greaterX = this.offx;
        if (this.offx < this.x) {
            lesserX = this.offx;
            greaterX = this.x;
        }
        let lesserY = this.y;
        let greaterY = this.offy;
        if (this.offy < this.y) {
            lesserY = this.offy;
            greaterY = this.y;
        }
        for (let unit of units) { // check if circle(C) intersects with rectangle(R)
            if (unit.x >= lesserX && unit.x <= greaterX && unit.y >= lesserY && unit.y <= greaterY) { // C inside R
                selectedUnits.push(unit); continue;
            }
            if (unit.y >= lesserY && unit.y <= greaterY) { // C & R aligned in y axis
                if (unit.x - unit.r <= greaterX && unit.x - unit.r >= lesserX) { // R is left of C
                    selectedUnits.push(unit); continue;
                } else if (unit.x + unit.r <= greaterX && unit.x + unit.r >= lesserX) { // R is left of C
                    selectedUnits.push(unit); continue;
                } else if (lesserX >= unit.x - unit.r && greaterX <= unit.x + unit.r) { // R passes C vertically
                    selectedUnits.push(unit); continue;
                }
            }
            if (unit.x >= lesserX && unit.x <= greaterX) { // C & R aligned in x axis
                if (unit.y - unit.r <= greaterY && unit.y - unit.r >= lesserY) { // R is top of C
                    selectedUnits.push(unit); continue;
                } else if (unit.y + unit.r <= greaterY && unit.y + unit.r >= lesserY) { // R is bottom of C
                    selectedUnits.push(unit); continue;
                } else if (lesserY >= unit.y - unit.r && greaterY <= unit.y + unit.r) { // R passes C horizontally
                    selectedUnits.push(unit); continue;
                }
            }
            { // check if R's edges are inside C
                if (getHypothenuse(unit, {x: lesserX, y: lesserY}) <= unit.r) {
                    selectedUnits.push(unit); continue;
                } else if (getHypothenuse(unit, {x: lesserX, y: greaterY}) <= unit.r) {
                    selectedUnits.push(unit); continue;
                } else if (getHypothenuse(unit, {x: greaterX, y: lesserY}) <= unit.r) {
                    selectedUnits.push(unit); continue;
                } else if (getHypothenuse(unit, {x: greaterX, y: greaterY}) <= unit.r) {
                    selectedUnits.push(unit); continue;
                }
            }
        }
    };
    this.updatePositionRelativeToBorder = (x_move, y_move) => {
        this.x += x_move;
        this.y += y_move;
        dragBox.offy = cursor.y;
        dragBox.offx = cursor.x;
    };
};

function Border() {
    this.width = 2500;
    this.height = 1500;
    this.x = 0;
    this.y = 0;
    this.speed = 25;
    if (this.width < canvas.width) {
        this.x = (canvas.width - this.width) / 2;
    }
    if (this.height < canvas.height) {
        this.x = (canvas.height - this.height) / 2;
    }
    this.update = () => {
        return this;
    };
    this.draw = () => {
        context.lineWidth = 10;
        context.strokeStyle = 'red';
        context.strokeRect(this.x, this.y, this.width, this.height);
        context.lineWidth = 1;

        context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < this.width; i += 100) {
            context.beginPath();
            context.moveTo(border.x + i, border.y);
            context.lineTo(border.x + i, border.y + border.height);
            context.stroke();
        }
        for (let i = 0; i < this.height; i += 100) {
            context.beginPath();
            context.moveTo(border.x, border.y + i);
            context.lineTo(border.x + border.width, border.y + i);
            context.stroke();
        }
    };
    this.moveUp = () => {
        this.y += this.speed;
        if (this.y >= 0) {
            this.y =  0;
        } else {
            for(let unit of units) {
                unit.updatePositionRelativeToBorder(0, this.speed);
            }
            if (dragBox.y != null && dragBox.offy != null) {
                dragBox.updatePositionRelativeToBorder(0, this.speed);
            }
        }
    };
    this.moveDown = () => {
        this.y -= this.speed;
        if (this.y <= canvas.height - this.height) {
            this.y =  canvas.height - this.height;
        } else {
            for(let unit of units) {
                unit.updatePositionRelativeToBorder(0, -this.speed);
            }
            if (dragBox.y != null && dragBox.offy != null) {
                dragBox.updatePositionRelativeToBorder(0, -this.speed);
            }
        }
    };
    this.moveLeft = () => {
        this.x += this.speed;
        if (this.x >= 0) {
            this.x =  0;
        } else {
            for(let unit of units) {
                unit.updatePositionRelativeToBorder(this.speed, 0);
            }
            if (dragBox.x != null && dragBox.offx != null) {
                dragBox.updatePositionRelativeToBorder(this.speed, 0);
            }
        }
    };
    this.moveRight = () => {
        this.x -= this.speed;
        if (this.x <= canvas.width - this.width) {
            this.x =  canvas.width - this.width;
        } else {
            for(let unit of units) {
                unit.updatePositionRelativeToBorder(-this.speed, 0);
            }
            if (dragBox.x != null && dragBox.offx != null) {
                dragBox.updatePositionRelativeToBorder(-this.speed, 0);
            }
        }
    };
};

function Cursor() {
    this.reset = () => {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
    }; this.reset();
    this.r = 7;
    this.update = () => {
        if (this.x != null && this.y != null) {
            if (this.x <= border.x + this.r) { //  check if cursor hit border edge
                this.x =  border.x + this.r;
                border.moveLeft();
            } else if (this.x >= border.x + border.width - this.r) {
                this.x =         border.x + border.width - this.r;
                border.moveRight();
            }
            if (this.y <= border.y + this.r) {
                this.y =  border.y + this.r;
                border.moveUp();
            } else if (this.y >= border.y + border.height - this.r) {
                this.y =         border.y + border.height - this.r;
                border.moveDown();
            }

            if (this.x <= 0 + this.r) { // check if cursor hit canvas edge
                this.x =  0 + this.r;
                border.moveLeft();
            } else if (this.x >= canvas.width - this.r) {
                this.x =         canvas.width - this.r;
                border.moveRight();
            }
            if (this.y <= 0 + this.r) {
                this.y =  0 + this.r;
                border.moveUp();
            } else if (this.y >= canvas.height - this.r) {
                this.y =         canvas.height - this.r;
                border.moveDown();
            }
        }
        return this;
    };
    this.draw = () => {
        if (this.x != null && this.y != null) {
            context.lineWidth = 3;
            context.strokeStyle = 'black';
            context.beginPath();
            context.moveTo(this.x, this.y - this.r);
            context.lineTo(this.x, this.y + this.r);
            context.stroke();
            context.beginPath();
            context.moveTo(this.x - this.r, this.y);
            context.lineTo(this.x + this.r, this.y);
            context.stroke();
            context.lineWidth = 1;
        }
    };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function keyDownHandler(event) {
    if (event.code == 'ControlLeft') {
        event.preventDefault();
        isCtrlDown = true;
    } else if (event.code == 'ShiftLeft') {
        event.preventDefault();
        isShftDown = true;
    } else if (event.code.indexOf('Digit') > -1) {
        event.preventDefault();
        if (isCtrlDown) {
            controledUnitsHotkeys[event.key] = [...selectedUnits];
        } else {
            if (controledUnitsHotkeys[event.key] && controledUnitsHotkeys[event.key].length) {
                selectedUnits = [...controledUnitsHotkeys[event.key]];
            } else {
                selectedUnits = [];
            }
        }
    } else if (event.code == 'KeyA') {
        event.preventDefault();
        if (isCtrlDown) {
            selectedUnits = [...units];
        }
    }
};

function keyUpHandler(event) {
    if (event.code == 'ControlLeft') {
        isCtrlDown = false;
    } else if (event.code == 'ShiftLeft') {
        isShftDown = false;
    }
};

function mouseDownHandler(event) {
    if (event.which == 3) { // right click
        moveSelectedUnitsTo(cursor.x, cursor.y);
        return;
    } else {
        selectedUnits = [];
        dragBox.setPosition(cursor.x, cursor.y);
        for (let unit of getUnitsHit({x: cursor.x, y: cursor.y})) {
            selectedUnits.push(unit);
        }
    }
};

function mouseMoveHandler(event) {
    let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    cursor.x += event.movementX;
    cursor.y += event.movementY;
    if (dragBox.x != null && dragBox.y != null) {
        dragBox.mouseMoveHandler();
    }
};

function mouseUpHandler(event) {
    dragBox.reset();
};

function contextMenuHandler(event) {
    event.preventDefault();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
