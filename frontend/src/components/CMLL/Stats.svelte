<script lang="ts">
    import { cmllTrainerStore } from "../../lib/trainers/CMLLTrainerStore.svelte";

    cmllTrainerStore.initialize();

    export let navigateTo: (pageName: string) => void;
</script>
<div>
    <button on:click={()=>navigateTo('home')}>Go back</button>
</div>
Stats

<div>

    {#if cmllTrainerStore.isInitialized}
    {@const stats = cmllTrainerStore.getStats()}
        <p>Total amount of cases {stats.totalCases}</p>
        <br>
        <p>Total mastered {stats.mastered}</p>
        <p>Total learning {stats.learning}</p>
        <p>Total unknown {stats.unknown}</p>
        <p>Total neven seen {stats.unseen}</p>
        <br>
        <p>Total learning {stats.wantToLearn}</p>
        <p> - of which are mastered {stats.learningMastered}</p>
        <p> - of which are learning {stats.learningLearning}</p>
        <p> - of which are unknown {stats.learningUnknown}</p>
        <p> - of which are neven seen {stats.learningUnseen}</p>
        <p>Total attemts {stats.totalAttemts}</p>
        <p>Total successes {stats.totalSuccess}</p>
        <p>Successrate {Math.round(stats.totalSuccess/stats.totalAttemts * 10000)/100}%</p>
    {:else}
        Stats loading
    {/if}

</div>