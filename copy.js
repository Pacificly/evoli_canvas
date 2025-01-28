document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copyBtn');
    const canvasCode = document.getElementById('canvasCode');
    const pixelCanvas = document.getElementById('pixelCanvas');

    // Copy functionality
    copyBtn.addEventListener('click', () => {
        canvasCode.select();
        document.execCommand('copy');
        
        // Optional: Provide visual feedback
        copyBtn.textContent = '✓';
        setTimeout(() => {
            copyBtn.textContent = '📋';
        }, 1000);
    });
});