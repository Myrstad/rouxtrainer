<script lang="ts">
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { setContext } from 'svelte';


    const currentPage = writable("home");

    function navigateTo(pageName: string) {
        currentPage.set(pageName);
    }

    // Define a key for your context
    const NAVIGATE_KEY = {}; // Or use a string, but an empty object is unique

    // Set the context, making navigateTo available to any child component below this one
    setContext(NAVIGATE_KEY, navigateTo);


    import Home from './Home.svelte';
    import Trainer from './Trainer.svelte';
    import Settings from './Settings.svelte';
    import Stats from './Stats.svelte'
</script>

<div class="app">
    {#if $currentPage === 'home'}
        <div in:fade><Home {navigateTo} /></div>
    {:else if $currentPage === 'trainer'}
        <div in:fade><Trainer {navigateTo} /></div>
    {:else if $currentPage === 'settings'}
        <div in:fade><Settings {navigateTo} /></div>
    {:else if $currentPage === 'stats'}
        <div in:fade><Stats {navigateTo} /></div>
    {:else}
        <p in:fade>Internal SPA State: Not Found</p>
    {/if}
</div>

<style>
    .app {
        width: 100%;
        max-width: 71rem;
        margin: 0 auto;
        margin-top: 4rem;
        min-height: 800px;
        outline: 2px solid #f003;
        outline-offset: -2px;
    }

    .app > div {
        height: 100%;
    }
</style>