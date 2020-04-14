
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 100;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let units = [];
let selectedUnits = [];
let dragBox = new DragBox();
let border = new Border();
let cursor = new Cursor();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

generateUnits();
function generateUnits() {
    for (let i = 0; i < 100; i++) {
        units.push(new Unit());
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

loop();
function loop() {
    context.fillStyle = 'rgba(230, 230, 230, 1)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let unit of units) {
        unit.update().draw();
    }

    border.update().draw();
    cursor.update().draw();
    dragBox.draw();

    window.requestAnimationFrame(loop);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        unit.moveX = x;
        unit.moveY = y;
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Unit() {
    this.x = randomBetween(100, 500);
    this.y = randomBetween(100, 500);
    this.moveX = this.x;
    this.moveY = this.y;
    this.r = 10;
    this.speed = 5;

    this.stop = () => {
        this.prevX = this.x;
        this.prevY = this.y;
        this.moveX = this.x;
        this.moveY = this.y;
    }; this.stop();

    this.update = () => {
        if (this.x != this.moveX || this.y != this.moveY) {
            let adj = Math.abs(this.x - this.moveX);
            let opp = Math.abs(this.y - this.moveY);
            let hyp = getHypothenuse(this, {x: this.moveX, y: this.moveY});
            let angle;
            let dx = 0, dy = 0;

            if (this.moveX <= this.x) {
                angle = Math.acos(adj / hyp);
                dx = -Math.cos(angle) * this.speed;
                if (this.moveY >= this.y) {
                    dy = Math.sin(angle) * this.speed;
                } else {
                    dy = -Math.sin(angle) * this.speed;
                }
            } else {
                angle = Math.acos(adj / hyp);
                dx = Math.cos(angle) * this.speed;
                if (this.moveY >= this.y) {
                    dy = Math.sin(angle) * this.speed;
                } else {
                    dy = -Math.sin(angle) * this.speed;
                }
            }

            if (hyp <= this.speed) {
                this.stop();
            } else {
                this.x += dx;
                this.y += dy;
                this.updateSpacing(2);
                this.updateBorderSpacing();
            }
        } else {
            this.updateSpacing(1);
            this.updateBorderSpacing();
            this.stop();
        }

        if (Math.abs(this.x - this.prevX) < 0.001 && Math.abs(this.y - this.prevY) < 0.001) { // stop recursive movement
            this.stop();
        }
        this.prevX = this.x;
        this.prevY = this.y;

        return this;
    };

    this.draw = () => {
        context.fillStyle = 'red';
        context.strokeStyle = 'red';
        context.beginPath();
        context.arc(border.x + this.x, border.y + this.y, this.r, Math.PI * 2, false);
        context.stroke();
        if (selectedUnits.includes(this)) {
            context.fill();
            context.strokeStyle = 'rgba(255, 0, 0, 0.2)';
            context.beginPath();
            context.moveTo(border.x + this.x, border.y + this.y);
            context.lineTo(border.x + this.moveX, border.y + this.moveY);
            context.stroke();
        }
    };

    this.updateSpacing = (div) => {
        for (let unit of units) {
            if (this != unit) {
                if (this.x == unit.x && this.y == unit.y) {
                    this.x = this.prevX;
                    this.y = this.prevY;
                }

                let radiusSum = (this.r + unit.r) / div;
                let hyp = getHypothenuse(this, unit);

                if (radiusSum >= hyp) {
                    let diff_x = this.x - unit.x;
                    let diff_y = this.y - unit.y;
                    let dx = diff_x / hyp;
                    let dy = diff_y / hyp;

                    this.x = unit.x + (radiusSum) * dx || this.moveX;
                    this.y = unit.y + (radiusSum) * dy || this.moveY;
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
};

function DragBox() {
    this.reset = function() {
        this.x = null;
        this.y = null;
        this.offx = null;
        this.offy = null;
        canvas.removeEventListener('mousemove', this.mouseMoveHandler);
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
    this.mouseMoveHandler = (event) => {
        selectedUnits = [];
        this.offx = event.offsetX;
        this.offy = event.offsetY;
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
};

function Border() {
    this.width = 2500;
    this.height = 2500;
    this.x = 0;
    this.y = 0;
    this.speed = 10;
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
        context.strokeStyle = 'black';
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
        console.log('Up');
        this.y += this.speed;
        if (this.y >= 0) {
            this.y =  0;
        }
    };
    this.moveDown = () => {
        console.log('Down');
        this.y -= this.speed;
        if (this.y <= canvas.height - this.height) {
            this.y =  canvas.height - this.height;
        }
    };
    this.moveLeft = () => {
        console.log('Left');
        this.x += this.speed;
        if (this.x >= 0) {
            this.x =  0;
        }
    };
    this.moveRight = () => {
        console.log('Right');
        this.x -= this.speed;
        if (this.x <= canvas.width - this.width) {
            this.x =  canvas.width - this.width;
        }
    };
};

function Cursor() {
    this.x = null;
    this.y = null;
    this.r = 20;
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
            context.lineWidth = 2;
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

document.addEventListener('mousedown', (event) => {
    if (event.which == 3) { // right click
        moveSelectedUnitsTo(cursor.x, cursor.y);
        return;
    } else {
        selectedUnits = [];
        dragBox.x = event.offsetX;
        dragBox.y = event.offsetY;
        for (let unit of getUnitsHit({x: event.offsetX, y: event.offsetY})) {
            selectedUnits.push(unit);
        }
        document.addEventListener('mousemove', dragBox.mouseMoveHandler);
    }
});

document.addEventListener('mousemove', (event) => {
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
});

document.addEventListener('mouseup', (event) => {
    dragBox.reset();
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
