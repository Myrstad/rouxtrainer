<script lang="ts">
    import { onMount } from "svelte";
    import type { CMLLCaseDefinition, TrainingCase } from "../../lib/trainers/CMLLTypes";
    import { Cube } from "../../lib/cube/Cube";
    import { Renderer2D } from "../../lib/cube/Renderer2D";
    
    //export let caseDefinition: CMLLCaseDefinition;
    export let trainingCase: TrainingCase;

    let previewContainerElement: HTMLElement;
    let cubeInstance: Cube | null = null;
    let rendererInstance: Renderer2D | null = null;

    function renderPreview() {
        if (!previewContainerElement || !cubeInstance || !rendererInstance) {            
            return;
        }        

        cubeInstance.reset();
        cubeInstance.rotateToState("y", "g");
        cubeInstance.paintRoux();

        const algorithmMoves = cubeInstance.getMovesFromAlgorithm(trainingCase.preferredAlgorithm);
        const reversedMoves = cubeInstance.reverseMoves(algorithmMoves); // To show the case state
        cubeInstance.applyMoves(reversedMoves);

        rendererInstance.render();
    }

    onMount(()=>{
        if (typeof window !== 'undefined' && previewContainerElement) {
            cubeInstance = new Cube(3)
            rendererInstance = new Renderer2D(previewContainerElement, cubeInstance);
            renderPreview();
        }
    })

    $: if (typeof window !== 'undefined' && trainingCase && rendererInstance && cubeInstance) {
        renderPreview();
    }
</script>

<div bind:this={previewContainerElement} class="cube-preview"></div>