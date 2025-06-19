<script lang="ts">
    import type { CMLLCaseDefinition, TrainingCase } from "../../lib/trainers/CMLLTypes";
    import { cmllTrainerStore } from "../../lib/trainers/CMLLTrainerStore.svelte";
    
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
<div>
    <button on:click={()=>navigateTo('home')}>Go back</button> <h1>Settings</h1>
</div>

<div class="settings">
    {#await initializationPromise}
        <p>Loading settings...</p>
    {:then _} 
        {#if errorLoading}
            <p class="error">Error loading settings: {errorLoading.message}</p>
        {:else if cmllTrainerStore.isInitialized}
            <h2>CMLL Trainer Settings</h2>

            <section>
                <h2>ALL CASES</h2>
                <button on:click={()=>learnAllCases()}>Learn all</button>
                <button on:click={()=>unlearnAllCases()}>Deselect all</button>
            </section>
            {#each Object.entries(groupedCases) as [groupName, caseDefsInGroup] (groupName)}
                {@const groupStats = getGroupStats(caseDefsInGroup)}
                <section>
                    <h3>{ groupName } - permutations</h3>
                    <span>Learning { groupStats.learning } out of { groupStats.total }</span>
                    <button on:click={()=>learnAllInGroup(caseDefsInGroup)}>Learn all</button>
                    <button on:click={()=>unlearnAllInGroup(caseDefsInGroup)}>Deselect all</button>
                    <div class="cases-grid">
                        {#each caseDefsInGroup as caseDef (caseDef.id)}
                            {@const trainingCase = cmllTrainerStore.getTrainingCase(caseDef.id)}
                            {#if trainingCase}
                                <div class="case-settomg">
                                    <p class="case-name">{ caseDef.id } - { caseDef.name }
                                        <br>
                                        <label class="learn-toggle">
                                            <span>Learn?</span>
                                            <input type="checkbox" checked={ trainingCase.wantToLearn } on:change={()=>handleWantToLearnToggle(caseDef.id)}/>
                                        </label>
                                        <br>
                                        { trainingCase.learningStatus } ({trainingCase.masteryLevel}/3)
                                    </p>

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