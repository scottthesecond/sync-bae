const SyncManager = require('../common/syncManager');
const syncManager = new SyncManager();

exports.triggerSync = async (req, res) => {
    const jobName = req.query.jobName;
    const job = syncManager.config.jobs.find(j => j.name === jobName);
    if (job) {
        try {
            await syncManager.executeJob(job);
            res.status(200).send('Sync executed successfully');
        } catch (err) {
            console.log(err)
            res.status(500).send(`Error executing sync: ${err.message}\n\n${err}`);
        }
    } else {
        res.status(404).send('Job not found');
    }
};