<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Cube } from "../../lib/cube/Cube";
    import { Renderer3D } from "../../lib/cube/Renderer3D";
    import { cmllTrainerStore } from "../../lib/trainers/CMLLTrainerStore.svelte";

    export let navigateTo: (pageName: string) => void;

    cmllTrainerStore.initialize();

    let sessionElements = cmllTrainerStore.selectNextCasesToPractice(5,1,1);
    let currentCaseIndex = 0;

    $: currentCase = sessionElements[currentCaseIndex];

    let reversedScrambleDisplay = "";
    let showSolution = false;

    const trainerCube = new Cube(3);
    let rendererInstance: Renderer3D | undefined = undefined;
    let canvasElement: HTMLCanvasElement;

    onMount(() => {
        if (sessionElements.length === 0) {
            return;
        }

        if (canvasElement) {
            rendererInstance = new Renderer3D(canvasElement, trainerCube);
            trainerCube.rotateToState("y", "b");
            rendererInstance.start();
            rendererInstance.cube.paintRoux(); 
            rendererInstance.cube.applyMoves(rendererInstance.cube.reverseMoves(rendererInstance.cube.getMovesFromAlgorithm(sessionElements[0].preferredAlgorithm)))      
        }

        return () => {
            console.log("WTF?");
            
            rendererInstance?.stop();
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
        if (!currentCase || !rendererInstance) return;

        trainerCube.reset();
        trainerCube.rotateToState("y", "b");
        trainerCube.paintRoux();
        
        showSolution = false;

        const algorithmMoves = trainerCube.getMovesFromAlgorithm(currentCase.preferredAlgorithm);
        const reversedMoves = trainerCube.reverseMoves(algorithmMoves);
        reversedScrambleDisplay = trainerCube.movesToString(reversedMoves);
        trainerCube.applyMoves(reversedMoves);


        
    }

    $: {
        if (typeof window !== 'undefined') { // Ensure this runs only in the browser
            if (currentCase && rendererInstance) {
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
        3D view for now
        <div class="cube-view">
            <canvas bind:this={canvasElement} width="600" height="600" id="test"></canvas>
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
    .card {
        display: flex;
        flex-direction: column;
    }
</style>