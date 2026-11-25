import { CronJob } from 'cron';
import { logger } from './logger';
import { deleteOldCECData, reconcileAllPolicyLists } from './database';
import { config } from './config-manager';
import { bulkDeleteCdnFiles } from './cdn';

async function runCleanSprData(): Promise<void> {
	const maxAgeMs = 14 * 24 * 60 * 60 * 1000; // 14 days
	const timestampInPast = new Date(Date.now() - maxAgeMs);
	const processingLimit = 1000; // S3 only allows 1k objects at a time
	let totalRemoved = 0;

	logger.info('Starting SPR data cleanup');
	let hasDataToDelete = true;
	while (hasDataToDelete) {
		const deletedData = await deleteOldCECData(timestampInPast, processingLimit);
		logger.info(`Deleted one batch of ${deletedData.length} CEC data objects, preparing CDN removal`);

		await bulkDeleteCdnFiles('spr', deletedData.map(v => v.file_key));
		logger.info(`CDN removal processed!`);

		totalRemoved += deletedData.length;
		hasDataToDelete = deletedData.length === processingLimit;
	}

	logger.success(`Completed cleanup of ${totalRemoved}`);
}

async function runSyncPolicyLists(): Promise<void> {
	const count = await reconcileAllPolicyLists();
	logger.info(`Reconciled ${count} NPPL entries with their tasks`);
}

function registerSchedule(schedule: string, name: string, fn: () => void | Promise<void>): void {
	CronJob.from({
		cronTime: schedule,
		onTick: async () => {
			try {
				const result = fn();
				await result;
			} catch (err) {
				logger.error(`Error in schedule ${name}: ${err}`);
			}
		},
		start: true,
		waitForCompletion: true
	});
	logger.info(`Added schedule ${name} for ${schedule}`);
}

export async function setupScheduler(): Promise<void> {
	// * Repairs NPPL entries left out of date by a task write that failed part way
	registerSchedule('15 * * * *', 'sync-nppl', runSyncPolicyLists);

	if (config.spr.cleanOldData) {
		registerSchedule('0 2 * * *', 'clean-spr-data', runCleanSprData);
	}
}
