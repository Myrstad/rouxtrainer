<script lang="ts">
    export let navigateTo: (pageName: string) => void;
</script>
<div>
    <button on:click={()=>navigateTo('home')}>Go back</button>
</div>
Stats