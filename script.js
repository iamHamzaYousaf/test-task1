class TaskListC {

    constructor(concurrency) {
        this.tasks = [];
        this.concurrency = concurrency;
    }
    addTask(task) {
        this.tasks.push(task)
    }
    async doTask(iterator) {
        const results = [];
        for (let [_, task] of iterator) {
            try {
                const res = await task.run();
                try {
                    if (task.isSuccessful(res)) {
                        await task.onSuccess(res);
                        results.push(res);
                    } 
                } catch (e) {
                    await task.onError(res);
                }
            } catch (e) {
                task.onError(e);
            }
        }
        return results;
    }

    async run() {
        const iterator = this.tasks.entries();
        const tasksWorkers = new Array(this.concurrency).fill(iterator).map(this.doTask);
        const res = await Promise.allSettled(tasksWorkers);
        const flattenedArrays = [];
        res.forEach((subArray) => {
            if (subArray.value) {
                subArray.value.forEach(elt => flattenedArrays.push(elt))
            }
        })

        // We reset the list of tasks after we have run them
        // so that we can add new tasks to the TaskListC and run only the newly added tasks
        this.tasks = [];
        return flattenedArrays;
    }
}

(async () => {
    const MAX_CONCURRENCY = 5;
    const taskList = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];;
    const p = new TaskListC(MAX_CONCURRENCY);


    const failedTasks = [];
    const successfullTasks = [];
    //for (let i = 0; i < taskList.length; i++) {
    for (let i of taskList) {
        
        p.addTask({
            name: `Task ${i}, `,
            async run() {
                console.log(`Running task ${i}`);
                await sleep(1000);
                if (Math.random() > 0.7) {
                    throw new Error('TaskError');
                }
                return i;
            },
            async onSuccess(res) {
                console.log(`Run task ${i} successfuly, res = ${res}`);
                successfullTasks.push(this);
            },
            async onError(err) {
                console.log(`Task ${i} failed with error = ${err}`);
                failedTasks.push(this);
            },
            async isSuccessful(res) {
                return typeof res === 'number';
            }
        })
    }

    const tasksResult = await p.run();
    // contains results of successful tasks
    console.log(tasksResult);

    console.log(`failed tasks: ${failedTasks.length}`);
    console.log(`successful tasks: ${successfullTasks.length}`);

})();