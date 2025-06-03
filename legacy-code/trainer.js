class CMLLTrainer {
    constructor() {
        this.cases = null;
        this.training = this._getLocalStorage();
        fetch("./CMLL-cases.json")
            .then(res =>{
                if (!res.ok)
                    throw new Error("IDFK");

                return res.json();
            }) 
            .then(data => {
                this.cases = data;
                console.log(data);
            })
    }

    _getLocalStorage() {
        const storedDataString = localStorage.getItem("CMLL");
        if (storedDataString === null) {
            return {}; // Not found
        }
        try {
            return JSON.parse(storedDataString);
        } catch (e) {
            console.error("Invalid JSON in localStorage for CMLL:", e);
            return {}; // Invalid JSON
        }

    }

    _reset() {
        if (confirm("Are you sure you want to reset ALL training data?"))
            localStorage.removeItem("CMLL")
    }

    _saveTraning() {
        localStorage.setItem("CMLL", JSON.stringify(this.training))
    }

    _crateCaseShell() {
        return {
            "id": "O1",
            "wantToLearn": true,
            "totalSeen": 0,
            "totalSuccess": 0,
            "masteryLevel": 0,
            "learningStatus": "unseen",
            "preferredAlgorithm": "R U R' F' R U R' U' R' F R2 U' R'"
        }
    }

    learnCase(id, algorithm) {
        let item = this._crateCaseShell();
        item.id = id;
        item.preferredAlgorithm = algorithm;
        if (!this.training[id]) {
            this.training[id] = item;
        } else {
            this.training[id].wantToLearn = true;
            this.training[id].algorithm = algorithm
        }
        this._saveTraning();
    }

    fail(id) {
        if (!this.training[id]) {
            console.error(`id: ${id} does not excist in training`)
            return;
        }
        this.training[id].totalSeen += 1;
        if (this.training[id].masteryLevel > 0)
            this.training[id].masteryLevel--;

        if (this.training[id].masteryLevel == 0)
            this.training[id].learningStatus = "unknown";
        else
            this.training[id].learningStatus = "learning";

        this._saveTraning();
    }

    unsure(id) {
        if (!this.training[id]) {
            console.error(`id: ${id} does not excist in training`);
            return
        }
        this.training[id].totalSeen += 1;
        this._saveTraning();
    }

    success(id) {
        if (!this.training[id]) {
            console.error(`id: ${id} does not excist in training`)
            return;
        }
        this.training[id].totalSeen += 1;
        this.training[id].totalSuccess += 1
        if (this.training[id].masteryLevel < 3)
            this.training[id].masteryLevel++;

        if (this.training[id].masteryLevel == 1)
            this.training[id].learningStatus = "learning";
        else
            this.training[id].learningStatus = "mastered";

        this._saveTraning();
    }

    removeWantToLearn(id) {
        if (!this.training[id]) {
            console.error("UHM???");
            return
        }
        this.training[id].wantToLearn = false;
        this._saveTraning();
    }

    selectNext(count = 5, maxLearning = 5, maxMastered = 1) {
        // Dont select from unseen / unknown if 5 ore more are in learning!
        let unknownCount;
        let learningCount;
        let masteredCount;
        let unseenCount;

        let totalLearningCount;

        console.log(this.training);

        console.log(Object.keys(this.training));
        Object.keys(this.training).forEach(key=>{
            const object = this.training[key];
            if (!object.wantToLearn)
                return;

            totalLearningCount += 1

            if (object.learningStatus == "mastered"){
                masteredCount += 1;
            }
            

        })
     
        
    }

}

test = new CMLLTrainer()
test.selectNext();
