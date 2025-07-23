<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Cube } from "../../lib/cube/Cube";
    import { Renderer3D } from "../../lib/cube/Renderer3D";
    import { Renderer2D } from "../../lib/cube/Renderer2D";
    import { cmllTrainerStore } from "../../lib/trainers/CMLLTrainerStore.svelte";

    export let navigateTo: (pageName: string) => void;

    cmllTrainerStore.initialize();

    let sessionElements = cmllTrainerStore.selectNextCasesToPractice(5,1,1);
    let currentCaseIndex = 0;

    $: currentCase = sessionElements[currentCaseIndex];

    let reversedScrambleDisplay = "";
    let showSolution = false;

    const trainerCube = new Cube(3);
    let renderer3DInstance: Renderer3D | undefined = undefined;
    let renderer2DInstance: Renderer2D | undefined = undefined;
    let canvasElement3D: HTMLCanvasElement;
    let previewContainerElement2D: HTMLElement;

    let currentView: '3D' | '2D' = '3D';

    onMount(() => {
        if (sessionElements.length === 0) {
            return;
        }

        // Initialize 3D renderer
        if (canvasElement3D) {
            renderer3DInstance = new Renderer3D(canvasElement3D, trainerCube);
            trainerCube.rotateToState("y", "b");
            renderer3DInstance.start();
            renderer3DInstance.cube.paintRoux();
            renderer3DInstance.cube.applyMoves(renderer3DInstance.cube.reverseMoves(renderer3DInstance.cube.getMovesFromAlgorithm(sessionElements[0].preferredAlgorithm)))
        }

        // Initialize 2D renderer
        if (previewContainerElement2D) {
            renderer2DInstance = new Renderer2D(previewContainerElement2D, trainerCube);
            render2DPreview();
        }

        return () => {            
            renderer3DInstance?.stop();
        }
    })

    function handleSuccess() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'success');
        currentCaseIndex++; // Move to the next case
    }

    function handleUnsure() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'unsure');
        showSolution = true; // Reveal the solution
    }

    function handleFail() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'fail');
        showSolution = true; // Reveal the solution
    }

    function handleNextAfterReveal() {
        currentCaseIndex++; // Move to the next case
    }

    function updateCubeDisplayForCurrentCase() {
        if (!currentCase) return;

        trainerCube.reset();
        trainerCube.rotateToState("y", "b");
        trainerCube.paintRoux();

        showSolution = false;

        const algorithmMoves = trainerCube.getMovesFromAlgorithm(currentCase.preferredAlgorithm);
        const reversedMoves = trainerCube.reverseMoves(algorithmMoves);
        reversedScrambleDisplay = trainerCube.movesToString(reversedMoves);
        trainerCube.applyMoves(reversedMoves);

        if (renderer2DInstance) {
            render2DPreview(); // Ensure 2D view is updated
        }
    }

    function render2DPreview() {
        if (!renderer2DInstance) return;
        // The trainerCube is already in the correct state from updateCubeDisplayForCurrentCase
        renderer2DInstance.render();
    }

    function setView(view: '3D' | '2D') {
        currentView = view;

        if (currentView === '2D') {
            renderer3DInstance?.stop();
        } else {
            renderer3DInstance?.start();
        }
    }




    $: {
        if (typeof window !== 'undefined') { // Ensure this runs only in the browser
            if (currentCase && renderer3DInstance && renderer2DInstance) {
                updateCubeDisplayForCurrentCase();
            }
            // If currentCase is undefined because currentCaseIndex is out of bounds 
            // (and sessionElements was not empty), it means the session is finished.
            // The template handles displaying the "Session finished" message.
            // If automatic navigation is desired upon session completion, it could be added here.
        }
    }
</script>
<div class="card">
    <div>
        <button on:click={()=>navigateTo('home')}>Go back</button> Trainer
    </div>
    {#if sessionElements.length === 0}
        <p>No cases selected for practice. Please check your settings or try again later.</p>
        <button on:click={() => navigateTo('home')}>Go to Home</button>
    {:else if currentCase}
        <div class="case-info">
            <p>Case: {currentCase.id} ({currentCaseIndex +1 }/{sessionElements.length})</p>
            <p>Setup Scramble: {reversedScrambleDisplay}</p>
        </div>

        <div class="view-toggle">
            <button on:click={() => setView('3D')} class:active={currentView === '3D'}>3D View</button>
            <button on:click={() => setView('2D')} class:active={currentView === '2D'}>2D View</button>
        </div>

        <div class="cube-display-container">
            <canvas bind:this={canvasElement3D} width="600" height="600" class="cube-view" style="display: {currentView === '3D' ? 'block' : 'none'};"></canvas>
            <div bind:this={previewContainerElement2D} class="preview-2d" style="display: {currentView === '2D' ? 'block' : 'none'};"></div>
        </div>

        {#if !showSolution}
            <div class="action-buttons">
                <button on:click={handleSuccess} class="success">Success</button>
                <button on:click={handleUnsure} class="unsure">Unsure</button>
                <button on:click={handleFail} class="fail">Fail</button>
            </div>
        {:else}
            <div class="solution-revealed">
                <p>Solution Algorithm: {currentCase.preferredAlgorithm}</p>
                <button on:click={handleNextAfterReveal}>Okay / Next</button>
            </div>
        {/if}
    {:else}
        <p>Session finnished</p>
    {/if}
</div>

<style>
    button {
        cursor: pointer;
    }

    .card {
        display: flex;
        flex-direction: column;
    }

    canvas {
        user-select: none;
        width: 600px;
        height: 600px;
    }

    .cube-display-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 600px; /* Adjust as needed */
    }

    .cube-display-container .preview-2d {
        width: 400px; /* Adjust size for 2D preview */
        height: 400px;
        border: 1px solid #ccc; /* Optional: for visual debugging */
    }



    .view-toggle {
        margin-bottom: 1rem;
        display: flex;
        gap: 10px;
    }
</style>