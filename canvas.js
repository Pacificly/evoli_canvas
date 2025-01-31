class PixelCanvas {
    constructor(canvasId, gridSize = 80, visibleGridSize = 80) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = gridSize;
        this.visibleGridSize = visibleGridSize;
        this.cellSize = this.canvas.width / this.visibleGridSize;
        this.canvasBuyCode = null;
        this.canvasColorCode = null;
        this.colorCommand = {"action":"color","plots":[]};
        this.buyCommand = {"action":"buy_plots","plots":[]};
        this.costText = document.getElementById('costBuyCommand');

        this.position = { x: 0, y: 0 };

        // open color_grid.csv and owner_grid.csv to initialize the grids
        this.colorGrid = [];
        this.ownerGrid = [];
        
        const img = new Image();
        img.src = 'color_grid.png'; // Path to your PNG file
        img.crossOrigin = 'Anonymous'; // Ensures cross-origin compatibility if needed

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, img.width, img.height).data;

            for (let y = 0; y < img.height; y++) {
                const row = [];
                for (let x = 0; x < img.width; x++) {
                    const index = (y * img.width + x) * 4;
                    const r = imageData[index];
                    const g = imageData[index + 1];
                    const b = imageData[index + 2];
                    const a = imageData[index + 3];

                    row.push(`rgba(${r},${g},${b},${a / 255})`); // Store as RGBA color string
                }
                this.colorGrid.push(row);
            }

            this.drawGrid();
            console.log(this.colorGrid);
        };

        //same for owner_grid
        const img2 = new Image();
        img2.src = 'owner_grid.png'; // Path to your PNG file
        img2.crossOrigin = 'Anonymous'; // Ensures cross-origin compatibility if needed

        img2.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img2.width;
            canvas.height = img2.height;
            ctx.drawImage(img2, 0, 0);

            const imageData = ctx.getImageData(0, 0, img2.width, img2.height).data;
            
            for (let y = 0; y < img2.height; y++) {
                const row = [];
                for (let x = 0; x < img2.width; x++) {
                    const index = (y * img2.width + x) * 4;
                    const r = imageData[index];
                    const g = imageData[index + 1];
                    const b = imageData[index + 2];
                    const a = imageData[index + 3];

                    row.push(`rgba(${r},${g},${b},${a / 255})`); // Store as RGBA color string
                }
                this.ownerGrid.push(row);
            }

            this.drawGrid();
            console.log(this.ownerGrid);
        };

        
        this.modeColorGrid = 1;
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
                if ((this.ownerGrid[y][x]==="0" || this.ownerGrid[y][x]==="-1")) {
                    //if the plot was already in the list, remove it
                    const index = this.buyCommand.plots.findIndex(plot => plot[0] === y && plot[1] === x);
                    if (index > -1) {
                        this.buyCommand.plots.splice(index, 1);
                    } else {
                        this.buyCommand.plots.push([y, x]);
                    }
                    //1 L€ per 16 plots (rounded up)
                    this.costText.innerHTML = Math.ceil(this.buyCommand.plots.length/16) + " L€";
                    this.canvasBuyCode.value = JSON.stringify(this.buyCommand);
                }
            } else {
                this.colorCommand.plots.push([y, x, this.selectedColor]);
                this.canvasColorCode.value = JSON.stringify(this.colorCommand);
            }
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
            this.modeColorGrid = (this.modeColorGrid + 1) % 3;
            this.drawGrid();
        });

        document.getElementById('ownerViewBtn').addEventListener('click', () => {
            this.displayOwnerGrid = !this.displayOwnerGrid;
            this.drawGrid();
        });

        // mouse wheel to zoom in and out, increasing or decreasing the visible grid size
        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            if (event.deltaY < 0) {
                this.visibleGridSize = Math.min(this.gridSize, this.visibleGridSize + 2);
            } else {
                this.visibleGridSize = Math.max(2, this.visibleGridSize - 2);
            }
            this.position.x = Math.min(this.gridSize - this.visibleGridSize, this.position.x);
            this.position.y = Math.min(this.gridSize - this.visibleGridSize, this.position.y);
            this.cellSize = this.canvas.width / this.visibleGridSize;
            this.drawGrid();
        });

        // arrow keys to move the visible grid
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.position.y = Math.max(0, this.position.y - 1);
                    break;
                case 'ArrowDown':
                    this.position.y = Math.min(this.gridSize - this.visibleGridSize, this.position.y + 1);
                    break;
                case 'ArrowLeft':
                    this.position.x = Math.max(0, this.position.x - 1);
                    break;
                case 'ArrowRight':
                    this.position.x = Math.min(this.gridSize - this.visibleGridSize, this.position.x + 1);
                    break;
                default:
                    return;
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

        const alpha = (color) => {
            return color.replace(')', ', 0.3)').replace('rgb', 'rgba');
        };
    
        const drawColorGrid = () => {
            if (this.modeColorGrid > 0) {
                for (let y = 0; y < this.visibleGridSize; y++) {
                    for (let x = 0; x < this.visibleGridSize; x++) {
                        const xp = x + this.position.x;
                        const yp = y + this.position.y;
                        this.ctx.fillStyle = this.colorGrid[yp][xp];
                        this.ctx.fillRect(
                            x * this.cellSize,
                            y * this.cellSize,
                            this.cellSize,
                            this.cellSize
                        );
    
                        // Draw grid lines if visible grid size is less than 60
                        if (this.visibleGridSize < 60) {
                            if (this.modeColorGrid === 2) {
                                this.ctx.strokeStyle = this.ownerGrid[yp][xp];
                                this.ctx.lineWidth = 2;
                            } else {
                                this.ctx.strokeStyle = '#e0e0e0';
                                this.ctx.lineWidth = 0.5;
                            }
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
        };
    
        const drawOwnerGrid = () => {
            if (this.displayOwnerGrid) {
                for (let y = 0; y < this.visibleGridSize; y++) {
                    for (let x = 0; x < this.visibleGridSize; x++) {
                        const xp = x + this.position.x;
                        const yp = y + this.position.y;
                        this.ctx.fillStyle = this.ownerGrid[yp][xp];
                        this.ctx.fillRect(
                            x * this.cellSize,
                            y * this.cellSize,
                            this.cellSize,
                            this.cellSize
                        );
    
                        // Draw grid lines if visible grid size is less than 60
                        if (this.visibleGridSize < 60) {
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
        };
    
        // Determine drawing order
        if (this.modeColorGrid >0) {
            drawColorGrid();
        }
        if (this.displayOwnerGrid) {
            drawOwnerGrid();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pixelCanvas = new PixelCanvas('pixelCanvas');
    pixelCanvas.canvasBuyCode = document.getElementById('canvasBuyCode');
    pixelCanvas.canvasColorCode = document.getElementById('canvasColorCode');
    pixelCanvas.canvasBuyCode.value = JSON.stringify(pixelCanvas.buyCommand);
    pixelCanvas.canvasColorCode.value = JSON.stringify(pixelCanvas.colorCommand);

    // Ensure the appropriate sections are toggled
    document.getElementById('colorViewBtn').addEventListener('click', () => {
        if (pixelCanvas.modeColorGrid > 0) {
            document.getElementById('colorPalette').classList.remove('hidden');
        } else {
            document.getElementById('colorPalette').classList.add('hidden');
        }
    });

    document.getElementById('ownerViewBtn').addEventListener('click', () => {
        if (!pixelCanvas.displayOwnerGrid) {
            document.getElementById('ownerList').classList.add('hidden');
        } else {
            document.getElementById('ownerList').classList.remove('hidden');
        }
    });

    document.addEventListener('coloris:pick', event => {
        pixelCanvas.selectedColor = event.detail.color;
      });
    
    //when canvasColorCode or canvasBuyCode is changed manually, check if it is a valid command and update the grids
    pixelCanvas.canvasColorCode.addEventListener('change', () => {
        try {
            pixelCanvas.colorCommand = JSON.parse(pixelCanvas.canvasColorCode.value);
            pixelCanvas.colorCommand.plots.forEach(plot => {
                this.colorGrid[plot[0]][plot[1]] = plot[2];
            });
            pixelCanvas.drawGrid();
        } catch (error) {
            console.error('Invalid color command:', error);
        }
    });

    pixelCanvas.canvasBuyCode.addEventListener('change', () => {
        try {
            pixelCanvas.buyCommand = JSON.parse(pixelCanvas.canvasBuyCode.value);
            pixelCanvas.buyCommand.plots.forEach(plot => {
                pixelCanvas.ownerGrid[plot[0]][plot[1]] = "-1";
            });
            pixelCanvas.drawGrid();
        } catch (error) {
            console.error('Invalid buy command:', error);
        }
    });
});
