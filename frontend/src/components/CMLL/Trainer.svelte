<script lang="ts">
    import { Cube } from "../../lib/cube/Cube";
    import { Renderer3D } from "../../lib/cube/Renderer3D";
    import { Renderer2D } from "../../lib/cube/Renderer2D";
    import { cmllTrainerStore } from "../../lib/trainers/CMLLTrainerStore.svelte";

    let { navigateTo } = $props<{ navigateTo: (pageName: string) => void }>();

    let initialized = $state(false);
    let sessionElements = $state<any[]>([]);
    let currentCaseIndex = $state(0);

    let currentCase = $derived(sessionElements[currentCaseIndex]);

    let reversedScrambleDisplay = $state("");
    let showSolution = $state(false);
    let lastOutcome = $state<'fail' | 'unsure' | null>(null);

    const trainerCube = new Cube(3);
    let renderer3DInstance: Renderer3D | undefined;
    let renderer2DInstance: Renderer2D | undefined;
    
    let canvasElement3D = $state<HTMLCanvasElement>();
    let previewContainerElement2D = $state<HTMLElement>();

    let currentView = $state<'3D' | '2D'>('3D');

    function startNewSession() {
        sessionElements = cmllTrainerStore.selectNextCasesToPractice(5,1,1);
        currentCaseIndex = 0;
        lastOutcome = null;
        showSolution = false;
    }

    $effect(() => {
        const init = async () => {
            await cmllTrainerStore.initialize();
            startNewSession();
            initialized = true;
        };
        init();
    });

    $effect(() => {
        if (canvasElement3D && !renderer3DInstance) {
            renderer3DInstance = new Renderer3D(canvasElement3D, trainerCube);
            trainerCube.rotateToState("y", "b");
            renderer3DInstance.start();
            renderer3DInstance.cube.paintRoux();
            
            return () => {            
                renderer3DInstance?.stop();
                renderer3DInstance = undefined;
            }
        }
    });

    $effect(() => {
        if (previewContainerElement2D && !renderer2DInstance) {
            renderer2DInstance = new Renderer2D(previewContainerElement2D, trainerCube);
            render2DPreview();
            return () => {
                renderer2DInstance = undefined;
            }
        }
    });

    $effect(() => {
        if (currentView === '2D') {
            renderer3DInstance?.stop();
        } else {
            renderer3DInstance?.start();
        }
    });

    $effect(() => {
        if (initialized && currentCase) {
            updateCubeDisplayForCurrentCase();
        }
    });

    function handleSuccess() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'success');
        lastOutcome = null;
        currentCaseIndex++;
    }

    function handleUnsure() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'unsure');
        lastOutcome = 'unsure';
        showSolution = true;
    }

    function handleFail() {
        if (!currentCase) return;
        cmllTrainerStore.recordAttempt(currentCase.id, 'fail');
        lastOutcome = 'fail';
        showSolution = true;
    }

    function handleNextAfterReveal() {
        lastOutcome = null;
        currentCaseIndex++;
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
            render2DPreview();
        }
    }

    function render2DPreview() {
        if (!renderer2DInstance) return;
        renderer2DInstance.render();
    }

    function setView(view: '3D' | '2D') {
        currentView = view;
    }
</script>
<div class="trainer">
    <div class="tab-navigation">
        <button onclick={()=>navigateTo('home')}>&lt;-- Go back</button> <h1>Trainer</h1>
    </div>
    {#if !initialized}
        <p>Loading...</p>
    {:else if sessionElements.length === 0}
        <p>No cases selected for practice. Please check your settings or try again later.</p>
        <button onclick={() => navigateTo('settings')}>Go to Settings</button>
    {:else if currentCase}
        <div class="card">
            <div class="view-toggle">
                <button onclick={() => setView('3D')} class:active={currentView === '3D'}>3D</button>
                <button onclick={() => setView('2D')} class:active={currentView === '2D'}>2D</button>
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
                    <button onclick={handleUnsure} class="unsure">Unsure</button>
                    <button onclick={handleSuccess} class="success">Success</button>
                    <button onclick={handleFail} class="fail">Fail</button>
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
                    <button class="next" onclick={handleNextAfterReveal}>Okay</button>
                </div>
            {/if}
        </div>
        <div class="session-progress">
            {#each { length: sessionElements.length } as _, i}
                <div class="progress-dot" class:active={i === currentCaseIndex}></div>
            {/each}
        </div>
    {:else}
        <div class="session-finished">
            <p>Session finished</p>
            <button onclick={startNewSession}>Start Next Session</button>
        </div>
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

    .session-finished {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .session-finished button {
        background-color: var(--neutral-900);
        color: var(--neutral-0);
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        font-size: 1rem;
    }
</style>