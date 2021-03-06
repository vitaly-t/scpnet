'use strict';

const {importQueue} = require('../config/queues');
const wk = require('../config/wikidot-kit');
const sentry = require('../config/sentry');
const pino = require('../config/pino');
const importPage = require('../jobs/import-wikidot-page');

pino.info('Import worker ready');

importQueue.process((job) => {
    const params = job.data;

    switch (params.action) {

        case 'full-import':
            pino.info(`Performing full import from ${params.wiki}`);
            return wk.fetchPagesList({wiki: params.wiki})
                .then((pages) => {
                    const queueInserts = pages.map((pageName) => {
                        return importQueue.add({
                            action: 'page-import',
                            wiki: params.wiki,
                            name: pageName
                        });
                    });
                    pino.info(`Full import from ${params.wiki} enqueued`);

                    sentry.captureMessage('Full wiki pages import scheduled', {
                        level: 'info',
                        extra: {
                            wiki: params.wiki,
                            pagesNumber: pages.length
                        }
                    });

                    return queueInserts;
                })
                .catch((error) => {
                    pino.error(error, 'Error fetching page list during full import', params);
                    sentry.captureException(error, {extra: params});
                });

        case 'page-import':
            return importPage({wiki: params.wiki, name: params.name});

        default:
            pino.error(`Rejecting job with unknown action "${params.action}"`);
            return Promise.reject(`Unknown job import job type "${params.type}"`);
    }
});
