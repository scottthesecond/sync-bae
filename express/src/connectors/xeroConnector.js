const { XeroClient } = require('xero-node');
const { loadConfig } = require('../utils/configLoader');

const config = loadConfig();
const xeroConfig = config.keys.find(k => k.platform === 'xero');

let xeroTokenSet = null;
let xeroTenantIds = null;

class XeroConnector {
    constructor() {
        this.xero = new XeroClient({
            clientId: xeroConfig.client_id,
            clientSecret: xeroConfig.client_secret,
            redirectUris: [xeroConfig.redirect_uri],
            scopes: 'openid profile email accounting.transactions offline_access'.split(' ')
        });
    }

    async authenticate(req, res) {
        const consentUrl = await this.xero.buildConsentUrl();
        res.redirect(consentUrl);
    }

    async callback(req) {
        const tokenSet = await this.xero.apiCallback(req.url);
        xeroTokenSet = tokenSet;
        this.xero.setTokenSet(tokenSet);

        const tenants = await this.xero.updateTenants(false);
        xeroTenantIds = tenants.map(tenant => tenant.tenantId);
        
        return 'Xero OAuth2 authentication successful.';
    }

    setTokenFromMemory() {
        if (xeroTokenSet) {
            this.xero.setTokenSet(xeroTokenSet);
        } else {
            throw new Error('Xero is not authenticated. Please authenticate first.');
        }
    }

    getTenantId() {
        if (!xeroTenantIds || xeroTenantIds.length === 0) {
            throw new Error('No Xero tenant IDs available. Please authenticate first.');
        }
        return xeroTenantIds[0];
    }

    async getData(resource) {
        this.setTokenFromMemory();
        const tenantId = this.getTenantId();
        const { table } = resource;
        if (table === 'invoices') {
            const response = await this.xero.accountingApi.getInvoices(tenantId);
            return response.body.invoices;
        }

        // Add handling for other tables if needed
    }

    async syncData(resource, data) {
        this.setTokenFromMemory();
        const tenantId = this.getTenantId();
        const { table } = resource;
        if (table === 'invoices') {
            for (const record of data) {
                if (record.InvoiceID) {
                    await this.xero.accountingApi.updateInvoice(tenantId, record.InvoiceID, { invoices: [record] });
                } else {
                    await this.xero.accountingApi.createInvoices(tenantId, { invoices: [record] });
                }
            }
        }

        // Add handling for other tables if needed
    }
}

module.exports = XeroConnector;