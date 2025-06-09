<script lang="ts">
    export let navigateTo: (pageName: string) => void;
</script>
<div class="grid">
    <div class="info">
        <h1>CMLL TRAINER</h1>
        <p>
            Wohoooooooo. This is just some information about this specific trainer!
        </p>
        <p>
            Never used this website or ANKI before? The jist is select algorithms to learn - press “TRAIN” and execute the given algorithm.
        </p>
        <p>
            Press 'SUCCESS' if u remembered correctly. Press left (yellow) if you are unsure - this gives no penalty nor reward. Press right (red) if you failed - this gives a internal punishment.
        </p>
        <a href="/guides/">Read guide</a>
    </div>
    <button class="fill" on:click={()=>navigateTo('trainer')}>TRAIN -&gt;</button>
    <button on:click={()=>navigateTo('settings')}>Settings</button>
    <button on:click={()=>navigateTo('stats')}>Stats</button>
</div>

<style>
    .grid {
        display: grid;
        gap: 1rem;
        grid-template-rows: 1fr 1fr 1fr;
        grid-template-columns: 2fr 1fr;
    }

    .info {
        background-color: var(--neutral-100);
        padding: 3rem 2rem;
        grid-row: span 3;
        border-radius: 2rem;
        display: flex;
        flex-direction: column;
        font-size: 1.25rem;
    }

    h1 {
        font-size: 4rem;
        font-weight: normal;
    }

    a {
        text-decoration: none;
        color: inherit;
        line-height: 100%;
        font-size: 1rem;
        padding: 0.5rem 1.25rem;
        border-radius: 2rem;
        outline: 1px solid var(--neutral-900);
        outline-offset: -1px;
        font-family: var(--font);
        width: fit-content;
        margin-top: auto;
    }

    button {
        font-size: 40px;
        line-height: 100%;
        letter-spacing: 4%;
        border: none;
        border-radius: 2rem;
        cursor: pointer;
        transition: border-radius 0.1s ease-out;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font);
        padding: 5rem 1rem;
    }
    
    button:hover,
    button:focus,
    button:active {
        border-radius: 4rem;
        transition: border-radius 0.25s ease-in;
    }

    button.fill {
        background-color: var(--neutral-900);
        color: var(--neutral-100);
        font-weight: 900;
    }
    
    /* Outline */
    button:not(.fill) {
        background-color: var(--neutral-0);
        outline: 4px solid var(--neutral-900);
        outline-offset: -4px;
    }
</style>