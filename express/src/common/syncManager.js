const { loadConfig } = require('../utils/configLoader');
const AirtableConnector = require('../connectors/airtableConnector');
const XeroConnector = require('../connectors/xeroConnector');

class SyncManager {
    constructor() {
        this.config = loadConfig();
        this.connectors = this.initializeConnectors();
        this.testMode = process.env.TEST_MODE === 'true';
    }

    initializeConnectors() {
        const connectors = {};
        this.config.keys.forEach(({ name, platform }) => {
            if (platform === 'airtable') {
                connectors[name] = new AirtableConnector(name);
            } else if (platform === 'xero') {
                connectors[name] = new XeroConnector();
            }
        });
        return connectors;
    }

    start() {
        this.config.jobs.forEach(job => {
            setInterval(() => {
                this.executeJob(job).catch(console.error);
            }, job.interval * 60 * 1000);
        });
    }

    async executeJob(job) {
        const sourceConnector = this.connectors[job.source.key];
        const destConnector = this.connectors[job.destination.key];

        const sourceData = await sourceConnector.getData(job.source.resource);
        const destData = await destConnector.getData(job.destination.resource);

        const mappedSourceData = this.mapData(sourceData, job.map);
        const mappedDestData = this.mapData(destData, job.map, true);

        const [toCreate, toUpdate] = this.compareData(mappedSourceData, mappedDestData);

        if (this.testMode) {
            console.log(`Test Mode: Would create ${toCreate.length} records and update ${toUpdate.length} records.`);
        } else {
            await this.syncData(destConnector, job.destination.resource, toCreate, toUpdate);
        }
    }

    mapData(data, map, reverse = false) {
        return data.map(item => {
            const mappedItem = {};
            map.forEach(({ source_field, dest_field }) => {
                const sourceKey = reverse ? dest_field : source_field;
                const destKey = reverse ? source_field : dest_field;
                const value = sourceKey.split('.').reduce((acc, key) => acc[key], item);
                mappedItem[destKey] = value;
            });
            return mappedItem;
        });
    }

    compareData(sourceData, destData) {
        const toCreate = [];
        const toUpdate = [];

        const destDataMap = new Map(destData.map(item => [item['Xero Invoice ID'], item]));

        sourceData.forEach(item => {
            const destItem = destDataMap.get(item['Xero Invoice ID']);
            if (!destItem) {
                toCreate.push(item);
            } else if (JSON.stringify(item) !== JSON.stringify(destItem)) {
                toUpdate.push({ ...item, id: destItem.id });
            }
        });

        return [toCreate, toUpdate];
    }

    async syncData(connector, resource, toCreate, toUpdate) {
        if (toCreate.length > 0) {
            await connector.syncData(resource, toCreate);
        }
        if (toUpdate.length > 0) {
            await connector.syncData(resource, toUpdate);
        }
    }

    getConnector(name) {
        return this.connectors[name];
    }
}

module.exports = SyncManager;