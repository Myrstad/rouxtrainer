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
                                    <p class="case-name">{ caseDef.id } - { caseDef.name }
                                        {#if trainingCase.wantToLearn}
                                            <span>- Learning</span>
                                        {:else}
                                            <span>- Not learning</span>
                                        {/if}
                                        <span>- is {trainingCase.learningStatus}</span>
                                        <br>
                                        <label class="learn-toggle">
                                            <span>Learn?</span>
                                            <input type="checkbox" checked={ trainingCase.wantToLearn } on:change={()=>handleWantToLearnToggle(caseDef.id)}/>
                                        </label>
                                    </p>
                                    
                                    <div class="body">
                                        <CmllCasePreview trainingCase={trainingCase} />
    
                                        <div class="algorithm-selection">
                                            {#each caseDef.algorithms as algorithm (algorithm)}
                                                <label>
                                                    <input 
                                                        type="radio"
                                                        name={`alg-${caseDef.id}`}
                                                        value={algorithm}
                                                        checked={trainingCase.preferredAlgorithm === algorithm}
                                                        on:change={()=>handlePreferredAlgoritmChange(caseDef.id, algorithm)}
                                                    />
                                                    {algorithm}
                                                </label>
                                                <br>
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

    .case-setting .body {
        display: flex;
        gap: 1.5rem;
    }

    :global(.cube-preview) {
        flex: 1;
        max-width: 100px;
        max-height: 100px;
        padding: 10px;
        border-radius: 1rem;
        background-color: var(--neutral-200);
    }
</style>