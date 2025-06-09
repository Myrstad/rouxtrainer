<script lang="ts">
    import { onMount } from "svelte";
    import { Cube } from "../../lib/cube/Cube";
    import { Renderer3D } from "../../lib/cube/Renderer3D";

    export let navigateTo: (pageName: string) => void;

    onMount(() => {
        const renderer = new Renderer3D(
            document.querySelector("#test") as HTMLCanvasElement,
            new Cube(3)
        );
        renderer.start();
        renderer.cube.rotateToState("y", "b");
        renderer.cube.paintRoux();
        console.log(renderer.cube.getMovesFromAlgorithm("Rw' x y z (F R F' R') r R m e s"))
        renderer.cube.applyMoves(
            renderer.cube.reverseMoves(renderer.cube.getMovesFromAlgorithm("F R U' R' U' R U R' F' R U R' U' R' F R F'"))
        )
        console.log(renderer.cube.movesToString((renderer.cube.getMovesFromAlgorithm("F R U' R' U' R U R' F' R U R' U' R' F R F'"))));
        
    })
</script>
<div>
    <button on:click={()=>navigateTo('home')}>Go back</button>
</div>
Trainer
<canvas width="600" height="600" id="test"></canvas>