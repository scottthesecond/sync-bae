const Airtable = require('airtable');

class AirtableConnector {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getData(resource) {
        const { base, table } = resource;
        const airtableBase = new Airtable({ apiKey: this.apiKey }).base(base);
        const records = await airtableBase(table).select().all();
        return records.map(record => ({ id: record.id, fields: record.fields }));
    }

    async syncData(resource, data) {
        const { base, table } = resource;
        const airtableBase = new Airtable({ apiKey: this.apiKey }).base(base);
        for (const record of data) {
            if (record.id) {
                await airtableBase(table).update([{ id: record.id, fields: record.fields }]);
            } else {
                await airtableBase(table).create([{ fields: record.fields }]);
            }
        }
    }

    async getModifiedRecords(resource) {
        const { base, table } = resource;
        const airtableBase = new Airtable({ apiKey: this.apiKey }).base(base);
        const records = await airtableBase(table).select({ filterByFormula: 'IS_AFTER({Modified}, LAST_MODIFIED_TIME())' }).all();
        return records.map(record => ({ id: record.id, fields: record.fields }));
    }
}

module.exports = AirtableConnector;