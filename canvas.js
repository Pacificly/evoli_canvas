class PixelCanvas {
    constructor(canvasId, gridSize = 40) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = gridSize;
        this.cellSize = this.canvas.width / gridSize;
        this.canvasCode = null;
        this.command = {"action":"color","plots":[]};

        // open color_grid.csv and owner_grid.csv to initialize the grids
        this.colorGrid = [];
        this.ownerGrid = [];
        fetch('color_grid.csv')
            .then(response => response.text())
            .then(text => {
                this.colorGrid = text.split('\n').map(row => row.split(','));
                this.drawGrid();
                console.log(this.colorGrid);
            });
        fetch('owner_grid.csv')
            .then(response => response.text())
            .then(text => {
                this.ownerGrid = text.split('\n').map(row => row.split(','));
            });
        
        this.displayColorGrid = true;
        this.displayOwnerGrid = false;
        this.selectedColor = '#FF0000';

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / this.cellSize);
            const y = Math.floor((event.clientY - rect.top) / this.cellSize);

            this.colorCell(x, y);

            //update canvas code
            if (this.displayOwnerGrid) {
                if (this.command.action === "buy_plots" && (this.ownerGrid[y][x]==="0" || this.ownerGrid[y][x]==="-1")) {
                    //if the plot was already in the list, remove it
                    const index = this.command.plots.findIndex(plot => plot[0] === y && plot[1] === x);
                    if (index > -1) {
                        this.command.plots.splice(index, 1);
                    } else {
                        this.command.plots.push([y, x]);
                    }
                }
            } else {
                if (this.command.action === "color") {
                    this.command.plots.push([y, x, this.selectedColor]);
                }
            }
            this.canvasCode.value = JSON.stringify(this.command);
        });

        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / this.cellSize);
            const y = Math.floor((event.clientY - rect.top) / this.cellSize);
            const color = this.colorGrid[y][x];
            navigator.clipboard.writeText(color).then(() => {
                console.log('Color copied to clipboard:', color);
                const coloris = document.getElementById('colorisWidget');
                coloris.value = color;
                coloris.dispatchEvent(new Event('input', { bubbles: true }));
                this.selectedColor = color;
            }).catch(err => {
                console.error('Failed to copy color:', err);
            });
        });

        // Toggle grid display buttons
        document.getElementById('colorViewBtn').addEventListener('click', () => {
            this.displayColorGrid = !this.displayColorGrid;
            if (this.displayColorGrid) {
                this.command = {"action":"color","plots":[]};
                this.canvasCode.value = JSON.stringify(this.command);
            }
            this.drawGrid();
        });

        document.getElementById('ownerViewBtn').addEventListener('click', () => {
            this.displayOwnerGrid = !this.displayOwnerGrid;
            if (this.displayOwnerGrid) {
                this.command = {"action":"buy_plots","plots":[]};
                this.canvasCode.value = JSON.stringify(this.command);
            }
            this.drawGrid();
        });
    }

    colorCell(x, y) {
        if (this.displayOwnerGrid) {
            switch (this.ownerGrid[y][x]) {
                case "-1":
                    this.ownerGrid[y][x] = "0";
                    break;
                case "0":
                    this.ownerGrid[y][x] = "-1";
                    break;
                default:
                    break;
            } 
        } else {
            this.colorGrid[y][x] = this.selectedColor;
        }
        this.drawGrid();
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the color grid first
        if (this.displayColorGrid) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    this.ctx.fillStyle = this.colorGrid[y][x];
                    this.ctx.fillRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );

                    // Draw grid lines
                    this.ctx.strokeStyle = '#e0e0e0';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        const users = {'-1':'rgba(251, 4, 4, 0.77)', '0':'rgba(218, 45, 229, 0.3)', '1':'rgba(45, 229, 106, 0.3)', '2':'rgba(97, 45, 229, 0.3)'}
        // Draw the owner grid on top if enabled
        if (this.displayOwnerGrid) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    this.ctx.fillStyle = users[this.ownerGrid[x][y]];
                    this.ctx.fillRect(
                        y * this.cellSize,
                        x * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );

                    // Draw grid lines
                    this.ctx.strokeStyle = '#a0a0a0';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pixelCanvas = new PixelCanvas('pixelCanvas');
    pixelCanvas.canvasCode = document.getElementById('canvasCode');

    // Ensure the appropriate sections are toggled
    document.getElementById('colorViewBtn').addEventListener('click', () => {
        document.getElementById('colorPalette').classList.remove('hidden');
        document.getElementById('ownerList').classList.add('hidden');
    });

    document.getElementById('ownerViewBtn').addEventListener('click', () => {
        document.getElementById('colorPalette').classList.add('hidden');
        document.getElementById('ownerList').classList.remove('hidden');
    });

    document.addEventListener('coloris:pick', event => {
        pixelCanvas.selectedColor = event.detail.color;
      });
});
