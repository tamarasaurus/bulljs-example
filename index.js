const Bull = require('bull');
const queue = new Bull('queue');

const inspectors = {
    phpmetrics: require('./inspectors/phpmetrics.js'),
    another: require('./inspectors/phpmetrics.js')
}

const isEveryJobComplete = () => {
    return queue.getCompletedCount().then((completedCount) => {
        return completedCount === 2
    })
}

const getAllJobResults = () => {
    return queue.getJobs().then(jobs => {
        return jobs.map(job => job.data);
    })
}

queue.clean(10).then(() => {
    queue.process(async (job, done) => {
        console.log('start', job.data.inspectorName)

        const Inspector = inspectors[job.data.inspectorName];
        const inspection = new Inspector();

        await inspection.setup();
        const data = await inspection.inspect();

        job.progress = 100;

        done(null, data);
    })

    queue.on('completed', async (job, result) => {
        if (await isEveryJobComplete()) {
            const allJobData = await getAllJobResults();
            console.log('All jobs done: ', allJobData);
            process.exit(0);
        }
    })

    queue.on('error', (error) => {
        console.log(error)
    })

    const job1 = queue.add({ inspectorName: 'phpmetrics' });
    const job2 = queue.add({ inspectorName: 'another' });
});