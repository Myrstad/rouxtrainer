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
    let lastOutcome: 'fail' | 'unsure' | null = null;

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
        lastOutcome = null;
        currentCaseIndex++; // Move to the next case
    }

    function handleUnsure() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'unsure');
        lastOutcome = 'unsure';
        showSolution = true; // Reveal the solution
    }

    function handleFail() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'fail');
        lastOutcome = 'fail';
        showSolution = true; // Reveal the solution
    }

    function handleNextAfterReveal() {
        lastOutcome = null;
        currentCaseIndex++; // Move to the next case
    }

    function updateCubeDisplayForCurrentCase() {
        if (!currentCase) return;

        trainerCube.reset();
        trainerCube.rotateToState("y", "b");
        trainerCube.paintRoux();

        showSolution = false;
        lastOutcome = null;

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
<div class="trainer">
    <div class="tab-navigation">
        <button on:click={()=>navigateTo('home')}>&lt;-- Go back</button> <h1>Trainer</h1>
    </div>
    {#if sessionElements.length === 0}
        <p>No cases selected for practice. Please check your settings or try again later.</p>
        <button on:click={() => navigateTo('settings')}>Go to Settings</button>
    {:else if currentCase}
        <div class="card">
            <div class="view-toggle">
                <button on:click={() => setView('3D')} class:active={currentView === '3D'}>3D</button>
                <button on:click={() => setView('2D')} class:active={currentView === '2D'}>2D</button>
            </div>
    
            <div class="cube-display-container">
                <canvas bind:this={canvasElement3D}  class="cube-view" style="display: {currentView === '3D' ? 'block' : 'none'};"></canvas>
                <div bind:this={previewContainerElement2D} class="preview-2d" style="display: {currentView === '2D' ? 'block' : 'none'};"></div>
            </div>
    
            
            {#if !showSolution}
                <div class="case-info">
                    <p class="group">
                        {cmllTrainerStore.getCaseDefinition(currentCase.id)?.group}
                    </p>
                    <div class="column">
                        <span class="number">
                            {"0"+currentCase.id.replace(/\D/g, '')}
                        </span>
                        <span class="name">
                            {cmllTrainerStore.getCaseDefinition(currentCase.id)?.name}
                        </span>
                    </div>
                </div>
                <p title="Setup" class="setup">
                    {reversedScrambleDisplay}
                </p>
                <div class="action-buttons">
                    <button on:click={handleUnsure} class="unsure">Unsure</button>
                    <button on:click={handleSuccess} class="success">Success</button>
                    <button on:click={handleFail} class="fail">Fail</button>
                </div>
            {:else}
                <div class="solution-container">

                    {#if lastOutcome === 'fail'}
                        <div class="chip fail">Failed</div>
                    {:else if lastOutcome === 'unsure'}
                        <div class="chip unsure">Unsure / Did not try</div>
                    {/if}
                    <p class="name">
                        {cmllTrainerStore.getCaseDefinition(currentCase.id)?.group+"0"+currentCase.id.replace(/\D/g, '')}
                        {cmllTrainerStore.getCaseDefinition(currentCase.id)?.name}
                    </p>
                    <p class="solution" title="solution">{currentCase.preferredAlgorithm}</p>
                </div>
                <div class="action-buttons">
                    <button class="next" on:click={handleNextAfterReveal}>Okay</button>
                </div>
            {/if}
        </div>
        <div class="session-progress">
            {#each { length: sessionElements.length } as _, i}
                <div class="progress-dot" class:active={i === currentCaseIndex}></div>
            {/each}
        </div>
    {:else}
        <p>Session finnished</p>
    {/if}
</div>

<style>
    .tab-navigation {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 2rem;
    }

    .tab-navigation button {
        font-size: 1rem;
        line-height: 100%;
        padding: 0.5rem 1.25rem;
        border-radius: 2rem;
        border: 1px solid var(--neutral-900);
        color: var(--neutral-900);
        background-color: var(--neutral-100);
    }

    .tab-navigation h1 {
        margin-top: 0;
        color: var(--neutral-900);
        font-size: 1.25rem;
        font-weight: 400;
        margin-bottom: 0;
    }

    button {
        cursor: pointer;
    }

    .card {
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: var(--neutral-100);
        border: 2px solid var(--neutral-900);
        border-radius: 1rem;
        padding: 1rem;
        max-width: 400px;
        color: var(--neutral-900);
        gap: 0.75rem;
    }

    canvas {
        user-select: none;
        width: 100%;
        aspect-ratio: 1/1;
    }

    .cube-display-container {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--neutral-0);
        border-radius: 2rem;
    }

    .cube-display-container .preview-2d {
        width: 100%;
        aspect-ratio: 1/1;
        margin: 3rem;
    }

    .case-info {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .case-info .group {
        font-size: 2.5rem;
        color: inherit;
        margin: 0;
    }

    .case-info .number {
        font-size: 0.75rem;
        line-height: 100%;
        color: #2F2FFF;
    }
    
    .case-info .name {
        font-size: 1.25rem;
        line-height: 100%;
        color: var(--neutral-1000);
    }

    .case-info .column {
        display: flex;
        flex-direction: column;
    }

    p.setup {
        margin: 0;
        margin-top: 0.75rem;
        text-align: center;
        font-weight: 500;
    }

    .view-toggle {
        display: flex;
        gap: 0.25rem;
        padding: 0.25rem;
        border-radius: 10rem;
        background-color: var(--neutral-200);
        outline: 1px solid var(--neutral-0);
        outline-offset: -1px;
    }

    .view-toggle button {
        outline: none;
        border: none;
        color: var(--neutral-900);
        background-color: var(--neutral-100);
        border-radius: 10rem;
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
    }

    .view-toggle button.active {
        background-color: var(--neutral-0);
        font-weight: 500;
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
        width: 100%;
    }

    .action-buttons button {
        outline: none;
        border: none;
        font-weight: 500;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        background-color: var(--neutral-200);
        height: 2rem;
        padding: 0 0.875rem;
        text-transform: uppercase;
    }

    .action-buttons button.success,
    .action-buttons button.next {
        flex: 1;
        border-radius: 10rem;
        background-color: var(--green-300);
    }
    .action-buttons button.fail {
        background-color: var(--red-500);
    }
    .action-buttons button.unsure {
        background-color: var(--yellow-300);
    }

    .solution-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .solution-container p {
        margin: 0;
    }

    .solution-container .name {
        font-size: 1.25rem;
        font-weight: 300;
        line-height: 100%;
    }

    .solution-container .solution {
        color: var(--neutral-1000);
        font-weight: 500;
    }

    .chip {
        color: var(--neutral-900);
        border-radius: 0.25rem;
        padding: 0.125 0.5rem;
        text-transform: uppercase;
    }

    .chip.unsure {
        background-color: var(--yellow-300);
    }
    .chip.fail {
        background-color: var(--red-500);
    }

    .session-progress {
        margin: 0 auto;
        margin-top: 1rem;
        display: flex;
        width: fit-content;
        gap: 0.125rem;
        padding: 0.125rem;
        background-color: var(--neutral-100);
        border-radius: 10rem;
        border: 1px solid var(--neutral-900);
    }

    .session-progress div {
        display: block;
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 10rem;
        background-color: var(--neutral-200);
    }

    .session-progress .active {
        background-color: var(--neutral-0);
    }

</style>