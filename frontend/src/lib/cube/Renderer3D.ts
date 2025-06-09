import { Sticker } from "./Sticker";
import { Cube } from "./Cube";
import { Quaternion, Vector3 } from "../utils/utils";

export class Renderer3D {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public cube: Cube
    private displayStickers: Sticker[] = [] 

    
    // Camera
    private focalLength: number = 32;
    private cameraDistance: number = 32;

    private cameraEuler: {x:number, y:number, z:number} = { x: 0.3, y: -0.3, z: 0.3 }
    private cameraQuaternion: Quaternion;

    // Mouse
    private isMouseDown: boolean = false;
    private lastMousePos: {x: number, y: number} = { x: 0, y: 0 }

    // Animation
    private animationFrameId: number | null = null;

    // Rendering
    private CANVAS_WIDTH: number = 600;
    private CANVAS_HEIGHT: number = 600;
    private STICKER_SCALE: number= 600/3/4;

    public constructor (canvas: HTMLCanvasElement, cube: Cube) {
        if (!canvas) {
            throw new Error("Canvas element not provided!");
        }
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Could not get 2D rendering context from canvas.");
        }
        this.ctx = ctx;
        this.cube = cube
        this.createFakeStickers();

        this.CANVAS_WIDTH = this.canvas.width;
        this.CANVAS_HEIGHT = this.canvas.height;

        this.cameraQuaternion = new Quaternion();
        this.cameraQuaternion.setFromEuler(this.cameraEuler.x, this.cameraEuler.y, this.cameraEuler.z)

        // bind
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.animate = this.animate.bind(this);
    }

    public start() : void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);

        // start animation
        this.animationFrameId = requestAnimationFrame(this.animate)
    }

    public stop() : void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null
        }
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    }

    private animate() : void {
        this.updateResolution();
        //console.log(this.CANVAS_HEIGHT, this.CANVAS_WIDTH, this.canvas.width, this.canvas.height);
        
        this.drawCube();
        this.animationFrameId = requestAnimationFrame(this.animate)
    }

    private drawCube() : void {
        this.createFakeStickers(); // reset stickers, should ideally only be called when cube state changes
        
        // clear canvas
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

        const centerX = this.CANVAS_WIDTH / 2;
        const centerY = this.CANVAS_HEIGHT / 2;
        
        this.displayStickers.forEach(sticker => {
            // Create temporary Vector3 instances for rotation
            const rotatedPosition = new Vector3(sticker.position[0], sticker.position[1], sticker.position[2])
                                        .applyQuaternion(this.cameraQuaternion);
            const rotatedNormal = new Vector3(sticker.normal[0], sticker.normal[1], sticker.normal[2])
                                      .applyQuaternion(this.cameraQuaternion);
            const rotatedVertices = sticker.vertices.map(vertex => {
                return new Vector3(vertex[0], vertex[1], vertex[2])
                           .applyQuaternion(this.cameraQuaternion);
            });

            // Update sticker's properties with rotated values for sorting and drawing
            // Note: For actual rendering, you might want to store these transformed points
            // in a separate array or directly use them for drawing without modifying
            // the original sticker's properties if you need the original for other purposes.
            // For this example, we'll use the rotated values for sorting and projection.
            sticker.position = [rotatedPosition.x, rotatedPosition.y, rotatedPosition.z];
            sticker.normal = [rotatedNormal.x, rotatedNormal.y, rotatedNormal.z];
            // Store rotated vertices as number[] for compatibility with existing drawing logic
            sticker.vertices = rotatedVertices.map(v => [v.x, v.y, v.z]);
        });

        this.displayStickers.sort((a,b) => b.position[0] - a.position[0])

        for (const sticker of this.displayStickers) {
            const projectedPoints: {x:number,y:number}[] = []
            for (const vertex of sticker.vertices) {
                const depth = -vertex[0]; 
                const y = vertex[1]; 
                const z = vertex[2]; 

                const actualDepth = this.cameraDistance - depth;
                if (actualDepth <= 0.001) { 
                    // If any vertex is behind or at the clipping plane, skip drawing this sticker.
                    // For more robust rendering, a proper clipping algorithm would be needed.
                    projectedPoints.length = 0; // Clear points to indicate skipping
                    break; 
                }

                const projectedX = (y * this.focalLength) / actualDepth;
                const projectedY = (z * this.focalLength) / actualDepth;

                const vX = centerX - projectedX * this.STICKER_SCALE;
                const vY = centerY - projectedY * this.STICKER_SCALE;
                projectedPoints.push({ x: vX, y: vY })
            }

            const orderedPoints = [
                projectedPoints[0],
                projectedPoints[1],
                projectedPoints[3],
                projectedPoints[2]
            ]

            this.ctx.fillStyle = sticker.color;
            this.ctx.beginPath();
            this.ctx.moveTo(orderedPoints[0].x, orderedPoints[0].y)
            for (let i = 1; i < orderedPoints.length; i++) {
                this.ctx.lineTo(orderedPoints[i].x, orderedPoints[i].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = this.STICKER_SCALE / 16;
            this.ctx.stroke();
        }
    }

    private createFakeStickers() : void {
        this.displayStickers = []
        this.cube.stickers.forEach(s => {
            let fakeSticker = new Sticker("", [0,0,0], "x", [0,0,0]) // fake data
            fakeSticker.color = s.color;
            fakeSticker.normal = s.normal;
            fakeSticker.position = s.position;
            fakeSticker.vertices = s.vertices;

            this.displayStickers.push(fakeSticker);
        })
    }

    
    public setResolution(width: number, height: number) {
        this.CANVAS_WIDTH = width;
        this.CANVAS_HEIGHT = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    private updateResolution() : void {
        this.CANVAS_HEIGHT = this.canvas.clientHeight;
        this.CANVAS_WIDTH  = this.canvas.clientWidth;
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;

        this.STICKER_SCALE = Math.min( this.CANVAS_WIDTH, this.CANVAS_HEIGHT ) / 12
    }

    // --- Event Handlers ---

    private handleMouseDown(e: MouseEvent) : void {
        this.isMouseDown = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY }
    }

    private handleMouseMove(e: MouseEvent) : void {
        if (!this.isMouseDown) return;

        const dx = e.clientX - this.lastMousePos.x
        const dy = e.clientY - this.lastMousePos.y

        this.lastMousePos = { x: e.clientX, y:e.clientY }

        const sensitivity = 0.005;

        // 1. Pitch rotation (up/down motion from dy)
        // This rotation is applied around the camera's LOCAL X-axis.
        // Controlled by vertical mouse movement.
        const pitchDeltaQuaternion = new Quaternion().setFromAxisAngle(
            new Vector3(0, 1, 0), // Correct: Local X-axis for pitch
            -dy * sensitivity     // Correct: -dy for intuitive up/down pitch
        )

        // 2. Yaw rotation (left/right motion from dx)
        // This rotation is applied around the GLOBAL Y-axis.
        // Controlled by horizontal mouse movement.
        const yawDeltaQuaternion = new Quaternion().setFromAxisAngle(
            new Vector3(0, 0, 1), // Correct: Global Y-axis for yaw
            dx * sensitivity     // Correct: -dx for intuitive left/right yaw
        )

        // Apply rotations:
        // FIRST: Apply pitch (local rotation relative to camera's current orientation)
        this.cameraQuaternion.premultiply(pitchDeltaQuaternion);

        // SECOND: Apply yaw (global rotation around the world's Y-axis)
        // This is crucial for the "orbiter" feel, ensuring horizontal movement
        // consistently rotates around the object's vertical axis.
        this.cameraQuaternion.premultiply(yawDeltaQuaternion); // Correct: 'multiply' for global yaw

        this.cameraQuaternion.normalize();

        // Convert the final quaternion to Euler angles for rendering
        // Your Quaternion.toEuler() method outputs XYZ order (Pitch=X, Roll=Y, Yaw=Z)
        // Your sticker.rotate also applies X, then Y, then Z. This consistency is good.
        this.cameraEuler = this.cameraQuaternion.toEuler();
    }

    private handleMouseUp() : void {
        this.isMouseDown = false;
    }

    private handleMouseLeave() : void {
        this.isMouseDown = false;
    }
}