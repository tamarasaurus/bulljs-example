const Bull = require('bull');
const queue = new Bull('inspect',  'redis://localhost:6379');

const inspectors = {
    phpmetrics: require('./inspectors/phpmetrics.js'),
    another: require('./inspectors/phpmetrics.js')
}

const isEveryJobComplete = () => {
    return queue.getCompletedCount().then((completedCount) => {
        return completedCount === 2
    })
}

const getAllJobResults = async () => {
    const jobs = await queue.getJobs();
    return jobs.map(job => job.data);
}

queue.clean(1000).then(() => {
    queue.process('inspect', 1, async (job, done) => {
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

    const job1 = queue.add('inspect', { name: '1', inspectorName: 'phpmetrics' });
    const job2 = queue.add('inspect', { name: '2', inspectorName: 'another' });
});