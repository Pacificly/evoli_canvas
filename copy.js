document.addEventListener('DOMContentLoaded', () => {
    const copyBuyBtn = document.getElementById('copyBuyBtn');
    const copycolorBtn = document.getElementById('copyColorBtn');
    const canvasBuyCode = document.getElementById('canvasBuyCode');
    const canvasColorCode = document.getElementById('canvasColorCode');
    const pixelCanvas = document.getElementById('pixelCanvas');

    // Copy functionality
    copyBuyBtn.addEventListener('click', () => {
        canvasBuyCode.select();
        document.execCommand('copy');
        
        // Optional: Provide visual feedback
        copyBuyBtn.textContent = '✓';
        setTimeout(() => {
            copyBuyBtn.textContent = '📋';
        }, 1000);
    });

    copyColorBtn.addEventListener('click', () => {
        canvasColorCode.select();
        document.execCommand('copy');
        
        // Optional: Provide visual feedback
        copyColorBtn.textContent = '✓';
        setTimeout(() => {
            copyColorBtn.textContent = '📋';
        }, 1000);
    });
});