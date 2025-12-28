<script lang="ts">
    import type { CMLLCaseDefinition, TrainingCase } from "../../lib/trainers/CMLLTypes";
    import { cmllTrainerStore } from "../../lib/trainers/CMLLTrainerStore.svelte";
    import CmllCasePreview from "./CMLLCasePreview.svelte";
    
    export let navigateTo: (pageName: string) => void;

    let isLoading = true;
    let errorLoading: Error | null = null;
    let groupedCases: { [key: string]: CMLLCaseDefinition[] } = {};

    const initializationPromise = cmllTrainerStore.initialize().then(()=>{
        if (cmllTrainerStore.isInitialized) {
            const tempGroupedCases: { [key: string]: CMLLCaseDefinition[] } = {};
            cmllTrainerStore.allCaseDefinitions.forEach(caseDef=>{
                if (!tempGroupedCases[caseDef.group]) {
                    tempGroupedCases[caseDef.group] = [];
                }
                tempGroupedCases[caseDef.group].push(caseDef);
            });
            groupedCases = tempGroupedCases;
        }
        isLoading = false;
    }).catch(err=>{
        console.error("Error initializing settings:", err)
        errorLoading = err;
        isLoading = false;
    });

    function handleWantToLearnToggle(caseID: string) {
        const trainingCase = cmllTrainerStore.getTrainingCase(caseID);
        if (trainingCase) {
            if (trainingCase.wantToLearn) {
                cmllTrainerStore.unlearnCase(caseID);
            } else {
                cmllTrainerStore.learnCase(caseID);
            }
        }
    }

    function handlePreferredAlgoritmChange(caseId: string, algorithm: string) {
        cmllTrainerStore.setPreferredAlgorithm(caseId, algorithm);
    }

    function learnAllInGroup(casesInGroup: CMLLCaseDefinition[]) {
        casesInGroup.forEach(caseDef=>{
            cmllTrainerStore.learnCase(caseDef.id);
        })
    }

    function unlearnAllInGroup(casesInGroup: CMLLCaseDefinition[]) {
        casesInGroup.forEach(caseDef=>{
            cmllTrainerStore.unlearnCase(caseDef.id);
        })
    }
    
    function learnAllCases() {
        cmllTrainerStore.allCaseDefinitions.forEach(caseDef => {
            cmllTrainerStore.learnCase(caseDef.id);
        });
    }

    function unlearnAllCases() {
        cmllTrainerStore.allCaseDefinitions.forEach(caseDef => {
            cmllTrainerStore.unlearnCase(caseDef.id);
        });
    }

    function getGroupStats(casesInGroup: CMLLCaseDefinition[]) {
        let learning = 0;
        const total = casesInGroup.length;
        casesInGroup.forEach(caseDef => {
            const trainingCase = cmllTrainerStore.getTrainingCase(caseDef.id);
            if (trainingCase?.wantToLearn) {
                learning++;
            }
        });

        return { learning, total };
    }

</script>
<div class="tab-navigation">
    <button on:click={()=>navigateTo('home')}>&lt;-- Go back</button> <h1>Settings</h1>
</div>

<div class="settings">
    {#await initializationPromise}
        <p>Loading settings...</p>
    {:then _} 
        {#if errorLoading}
            <p class="error">Error loading settings: {errorLoading.message}</p>
        {:else if cmllTrainerStore.isInitialized}
            {@const allStats = getGroupStats(cmllTrainerStore.allCaseDefinitions)}
            <h2>CMLL Trainer Settings</h2>
            <span>Additional settings to be added!</span>

            <section>
                <h2>ALL CASES</h2>
                {#if allStats}
                    <span>Learning { allStats.learning } out of { allStats.total }</span>
                    <br>
                {/if}
                <button on:click={()=>learnAllCases()}>Learn all</button>
                <button on:click={()=>unlearnAllCases()}>Deselect all</button>
            </section>
            {#each Object.entries(groupedCases) as [groupName, caseDefsInGroup] (groupName)}
                {@const groupStats = getGroupStats(caseDefsInGroup)}
                <section>
                    <h2>{ groupName } - permutations</h2>
                    <span>Learning { groupStats.learning } out of { groupStats.total }</span>
                    <br>
                    <button on:click={()=>learnAllInGroup(caseDefsInGroup)}>Learn all</button>
                    <button on:click={()=>unlearnAllInGroup(caseDefsInGroup)}>Deselect all</button>
                    <div class="cases-grid">
                        {#each caseDefsInGroup as caseDef (caseDef.id)}
                            {@const trainingCase = cmllTrainerStore.getTrainingCase(caseDef.id)}
                            {#if trainingCase}
                                <div class="case-setting">
                                    <div class="case-header">
                                        <p class="text-rg">
                                            <b>{ caseDef.id }</b> - { caseDef.name }
                                            <span class="chip text-sm {trainingCase.learningStatus}">{trainingCase.learningStatus}</span>
                                            {#if trainingCase.wantToLearn}
                                                <span class="chip text-sm active">learning</span>
                                            {:else}
                                                <span class="chip text-sm active">not learning</span>
                                            {/if}
                                        </p>
                                        <label class="learn-toggle">
                                            <span>Learn?</span>
                                            <input type="checkbox" checked={ trainingCase.wantToLearn } on:change={()=>handleWantToLearnToggle(caseDef.id)}/>
                                        </label>
                                    </div>
                                    
                                    <div class="body">
                                        <CmllCasePreview trainingCase={trainingCase} />
    
                                        <div class="algorithm-selection">
                                            {#each caseDef.algorithms as algorithm, index (algorithm)}
                                            <label>
                                                <input 
                                                type="radio"
                                                name={`alg-${caseDef.id}`}
                                                value={algorithm}
                                                checked={trainingCase.preferredAlgorithm === algorithm}
                                                on:change={()=>handlePreferredAlgoritmChange(caseDef.id, algorithm)}
                                                />
                                                <span class="radio-button-body text-sm">
                                                    <span class="icon">
                                                        {#if caseDef.recommended.includes(index)}
                                                            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.4785 5.91504L10.5957 6.19727L10.9004 6.22168L15.8809 6.62012L12.0859 9.87207L11.8545 10.0703L11.9248 10.3672L13.084 15.2275L8.82031 12.623L8.55957 12.4639L8.29883 12.623L4.03418 15.2275L5.19434 10.3672L5.26465 10.0703L5.0332 9.87207L1.2373 6.62012L6.21875 6.22168L6.52344 6.19727L6.64062 5.91504L8.55957 1.30176L10.4785 5.91504Z"/></svg>
                                                        {/if}
                                                    </span>
                                                    {algorithm}
                                                </span>
                                            </label>
                                            <!-- <br> -->
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        {/each}

                    </div>
                </section>
            {/each}
        {:else}
            <p>Initializing settings...</p>
        {/if}
    {:catch error}
        <p class="error">Error loading settings component: {error.message}</p>
    {/await}
</div>

<style >
    .tab-navigation {
        display: flex;
        gap: 1rem;
        align-items: center;
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
    }

    h1, h2 {
        font-size: 1.25rem;
        font-weight: 400;
        margin-top: 2em;
        margin-bottom: 0;
    }

    h2 + span {
        color: var(--neutral-800);
    }

    .cases-grid {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .case-setting {
        padding: 1rem 2rem;
        background-color: var(--neutral-100);
        border-radius: 0.5rem;

    }

    .cases-grid .case-setting:nth-child(1) {
        border-top-left-radius: 1.5rem;
    }
    .cases-grid .case-setting:nth-child(2) {
        border-top-right-radius: 1.5rem;
    }
    .cases-grid .case-setting:nth-last-child(2) {
        border-bottom-left-radius: 1.5rem;
    }
    .cases-grid .case-setting:nth-last-child(1) {
        border-bottom-right-radius: 1.5rem;
    }

    .case-setting .body {
        padding-top: 1.5rem;
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 1.5rem;
    }

    .case-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .case-header p {
        margin: 0;
    }

    .case-setting .chip {
        padding: 2px 10px;
    }
    .case-setting .chip.active {
        background-color: var(--neutral-200);
        color: var(--neutral-800);
    }

    .case-setting .chip.mastered {
        background-color: var(--green-200);
        color: var(--green-800);
    }
    .case-setting .chip.unseen {
        background-color: var(--blue-200);
        color: var(--blue-800);
    }
    .case-setting .chip.unknown {
        background-color: var(--red-200);
        color: var(--red-800);
    }
    .case-setting .chip.learning {
        background-color: var(--yellow-200);
        color: var(--yellow-800);
    }

    .learn-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .learn-toggle input {
        width: 1.5rem;
        height: 1.5rem;
    }

    .algorithm-selection {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .algorithm-selection label {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .radio-button-body {
        background-color: var(--neutral-0);
        color: var(--neutral-900);
        padding-left: .5rem;
        padding-right: 1rem;
        border-radius: 0.25rem;
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
        min-height: 22px;
    }

    input:checked + .radio-button-body {
        background-color: var(--neutral-900);
        color: var(--neutral-100);
        border-radius: 1rem;
    }

    .radio-button-body .icon {
        display: grid;
        place-items: center;
        width: 18px;
        display: inline-block;
    }

    .radio-button-body .icon svg {
        fill: var(--neutral-200);
        stroke: var(--neutral-900);
    }

    input:checked + .radio-button-body .icon svg {
        fill: var(--neutral-200);
        stroke: var(--neutral-0);
    }

    :global(.cube-preview) {
        flex: 1 0 auto;
        max-width: 100px;
        max-height: 100px;
        padding: 10px;
        border-radius: 1rem;
        background-color: var(--neutral-200);
    }
</style>