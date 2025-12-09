/**
 * LiteCanvas-inspired Game Loop Wrapper for Research Visualization
 * Lightweight pixel-art renderer for AI agent laboratory
 * Target: <10KB, 30 FPS, zero dependencies
 *
 * SSE Event Schema:
 * {
 *   "type": "stage_started" | "stage_completed" | "agent_active" | "agent_idle",
 *   "stage": "Literature Review",  // one of the 7 research stages
 *   "agent": "lit_reviewer",       // agent identifier
 *   "message": "Found 12 relevant papers..."
 * }
 */

// 7 Research Stages (matching Agent Laboratory workflow)
export const RESEARCH_STAGES = [
  { id: 'literature_review', name: 'Literature Review', shortName: 'Lit Review' },
  { id: 'plan_formulation', name: 'Plan Formulation', shortName: 'Planning' },
  { id: 'data_preparation', name: 'Data Preparation', shortName: 'Data Prep' },
  { id: 'experiments', name: 'Running Experiments', shortName: 'Experiments' },
  { id: 'interpretation', name: 'Results Interpretation', shortName: 'Results' },
  { id: 'writing', name: 'Report Writing', shortName: 'Writing' },
  { id: 'refinement', name: 'Report Refinement', shortName: 'Refinement' }
];

// 5 Agent Researchers
export const AGENT_RESEARCHERS = [
  { id: 'lit_reviewer', name: 'Lit Reviewer', color: '#8b5cf6' },
  { id: 'idea_gen', name: 'Idea Generator', color: '#3b82f6' },
  { id: 'data_analyst', name: 'Data Analyst', color: '#10b981' },
  { id: 'experimenter', name: 'Experimenter', color: '#f59e0b' },
  { id: 'writer', name: 'Paper Writer', color: '#ec4899' }
];

export class LabRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.running = false;
        this.fps = options.fps || 30;
        this.frameTime = 1000 / this.fps;
        this.lastFrame = 0;

        // Assets
        this.images = {};
        this.loaded = false;

        // Game state
        this.sprites = [];
        this.breadcrumbs = [];

        // Resize canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
    }

    /**
     * Load image assets
     */
    async loadAssets(assets) {
        const promises = Object.entries(assets).map(([key, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    resolve();
                };
                img.onerror = () => reject(new Error(`Failed to load ${src}`));
                img.src = src;
            });
        });

        await Promise.all(promises);
        this.loaded = true;
        console.log('[LabRenderer] Assets loaded:', Object.keys(this.images));
    }

    /**
     * Start the game loop
     */
    start(updateFn, drawFn) {
        this.updateFn = updateFn;
        this.drawFn = drawFn;
        this.running = true;
        this.lastFrame = performance.now();
        this.loop();
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
    }

    /**
     * Main game loop (requestAnimationFrame)
     */
    loop() {
        if (!this.running) return;

        const now = performance.now();
        const delta = now - this.lastFrame;

        // Cap at target FPS
        if (delta >= this.frameTime) {
            this.lastFrame = now - (delta % this.frameTime);

            // Update game state
            if (this.updateFn) this.updateFn(delta / 1000); // Convert to seconds

            // Clear canvas
            this.clear();

            // Draw frame
            if (this.drawFn) this.drawFn(this.ctx);
        }

        requestAnimationFrame(() => this.loop());
    }

    /**
     * Clear canvas
     */
    clear(color = '#1a1a2e') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw sprite from spritesheet
     * @param {string} imageKey - Key in this.images
     * @param {number} sx - Source X
     * @param {number} sy - Source Y
     * @param {number} sw - Source width
     * @param {number} sh - Source height
     * @param {number} dx - Destination X
     * @param {number} dy - Destination Y
     * @param {number} dw - Destination width (optional, defaults to sw)
     * @param {number} dh - Destination height (optional, defaults to sh)
     */
    drawSprite(imageKey, sx, sy, sw, sh, dx, dy, dw = sw, dh = sh) {
        if (!this.images[imageKey]) {
            console.warn(`[LabRenderer] Image not loaded: ${imageKey}`);
            return;
        }

        this.ctx.drawImage(
            this.images[imageKey],
            sx, sy, sw, sh,
            dx, dy, dw, dh
        );
    }

    /**
     * Draw image
     */
    drawImage(imageKey, x, y, width, height) {
        if (!this.images[imageKey]) return;

        if (width && height) {
            this.ctx.drawImage(this.images[imageKey], x, y, width, height);
        } else {
            this.ctx.drawImage(this.images[imageKey], x, y);
        }
    }

    /**
     * Draw rectangle
     */
    rect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }

    /**
     * Draw rectangle outline
     */
    rectOutline(x, y, width, height, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, width, height);
    }

    /**
     * Draw circle
     */
    circle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw text
     */
    text(str, x, y, color = '#ffffff', font = '12px monospace') {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.fillText(str, x, y);
    }

    /**
     * Draw text centered
     */
    textCentered(str, x, y, color = '#ffffff', font = '12px monospace') {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(str, x, y);
        this.ctx.textAlign = 'left'; // Reset
    }
}

/**
 * Sprite class for animated characters
 */
export class Sprite {
    constructor(x, y, spritesheet, frameWidth, frameHeight) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.spritesheet = spritesheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.currentFrame = 0;
        this.animationSpeed = 0.1;
        this.animationTimer = 0;
        this.moving = false;
        this.speed = 100; // pixels per second
    }

    /**
     * Move sprite to target position
     */
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.moving = true;
    }

    /**
     * Update sprite position and animation
     */
    update(deltaTime) {
        // Move towards target
        if (this.moving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.moving = false;
                this.currentFrame = 0; // Idle frame
            } else {
                const moveDistance = this.speed * deltaTime;
                this.x += (dx / distance) * moveDistance;
                this.y += (dy / distance) * moveDistance;

                // Animate while moving
                this.animationTimer += deltaTime;
                if (this.animationTimer >= this.animationSpeed) {
                    this.currentFrame = (this.currentFrame + 1) % 3; // 3 walking frames
                    this.animationTimer = 0;
                }
            }
        }
    }

    /**
     * Draw sprite
     */
    draw(renderer) {
        const sx = this.currentFrame * this.frameWidth;
        const sy = 0;

        renderer.drawSprite(
            this.spritesheet,
            sx, sy,
            this.frameWidth, this.frameHeight,
            this.x, this.y,
            this.frameWidth * 2, this.frameHeight * 2 // 2x scale
        );
    }
}

/**
 * Breadcrumb stage class
 */
export class BreadcrumbStage {
    constructor(index, name, x, y) {
        this.index = index;
        this.name = name;
        this.x = x;
        this.y = y;
        this.status = 'pending'; // 'pending' | 'in-progress' | 'completed'
        this.radius = 20;
    }

    /**
     * Draw breadcrumb stage
     */
    draw(renderer) {
        // Draw connector line (except for first stage)
        if (this.index > 0) {
            const prevX = this.x - 100;
            renderer.ctx.strokeStyle = this.status === 'completed' ? '#10b981' : '#374151';
            renderer.ctx.lineWidth = 3;
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(prevX + 20, this.y);
            renderer.ctx.lineTo(this.x - 20, this.y);
            renderer.ctx.stroke();
        }

        // Draw circle
        let color;
        if (this.status === 'completed') {
            color = '#10b981'; // green
        } else if (this.status === 'in-progress') {
            color = '#f59e0b'; // orange (will animate)
        } else {
            color = '#6b7280'; // gray
        }

        renderer.circle(this.x, this.y, this.radius, color);

        // Pulse animation for in-progress
        if (this.status === 'in-progress') {
            const time = Date.now() / 1000;
            const pulseRadius = this.radius + Math.sin(time * 4) * 5;
            renderer.ctx.strokeStyle = '#f59e0b';
            renderer.ctx.lineWidth = 2;
            renderer.ctx.globalAlpha = 0.5;
            renderer.ctx.beginPath();
            renderer.ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
            renderer.ctx.stroke();
            renderer.ctx.globalAlpha = 1;
        }

        // Draw checkmark for completed
        if (this.status === 'completed') {
            renderer.ctx.strokeStyle = '#ffffff';
            renderer.ctx.lineWidth = 3;
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(this.x - 8, this.y);
            renderer.ctx.lineTo(this.x - 2, this.y + 6);
            renderer.ctx.lineTo(this.x + 8, this.y - 6);
            renderer.ctx.stroke();
        }

        // Draw stage name
        renderer.textCentered(
            this.name,
            this.x,
            this.y + 40,
            '#d1d5db',
            'bold 10px monospace'
        );
    }
}
