import xmlbuilder from 'xmlbuilder';
import moment from 'moment';
import express from 'express';
import mongoose from 'mongoose';
import { config } from '@/config-manager';
import { getDefaultPolicyList } from '@/policy-list-defaults';
import { restrictHostnames } from '@/middleware/host-limit';
import { PolicyList } from '@/models/policy-list';
import { getTaskPolicyListPriorities, syncPolicyListTasks } from '@/database';
import type { IPolicyListPriority } from '@/types/mongoose/policy-list';
import type { PolicyList as PolicyListXML } from '@/types/common/policylist';

const nppl = express.Router();

nppl.get([
	'/p01/policylist/:majorVersion/:countryCode',
	'/p01/policylist/:consoleType/:majorVersion/:countryCode'
], async (request, response) => {
	const { majorVersion, countryCode } = request.params;
	const consoleType = request.params.consoleType || '0'; // * Default to the 3DS

	if (consoleType !== '0' && consoleType !== '1') {
		response.sendStatus(500);
		return;
	}

	if (consoleType === '0' && majorVersion !== '3') {
		response.sendStatus(404);
		return;
	}
	if (consoleType === '1' && majorVersion !== '1') {
		response.sendStatus(404);
		return;
	}

	const defaultPolicyList = getDefaultPolicyList(countryCode, Number(majorVersion));

	try {
		const filter = {
			country_code: countryCode,
			major_version: Number(majorVersion)
		};

		let policyDoc = await PolicyList.findOne(filter);

		if (!policyDoc) {
			// * Existing lists get new tasks pushed to them by addTaskToPolicyLists, new lists
			// * start with every registered task. Registered tasks override the hardcoded
			// * defaults for the same title and task
			const taskPriorities = await getTaskPolicyListPriorities(defaultPolicyList.major_version);
			const isOverridden = (p: IPolicyListPriority): boolean => taskPriorities.some(t => t.title_id === p.title_id && t.task_id === p.task_id);
			defaultPolicyList.priority = [...defaultPolicyList.priority.filter(p => !isOverridden(p)), ...taskPriorities];

			try {
				await PolicyList.updateOne(filter, { $setOnInsert: defaultPolicyList }, { upsert: true, setDefaultsOnInsert: true });
			} catch (error) {
				// * Another request created this list at the same time, which is fine
				if (!(error instanceof mongoose.mongo.MongoServerError && error.code === 11000)) {
					throw error;
				}
			}

			policyDoc = await PolicyList.findOne(filter);
		}

		// * Also covers lists stored before tasks were added to the NPPL
		if (policyDoc && !policyDoc.tasks_synced) {
			await syncPolicyListTasks(countryCode, policyDoc.major_version);
			policyDoc = await PolicyList.findOne(filter);
		}

		if (!policyDoc) {
			throw new Error(`Failed to create policy list for ${countryCode} (major version ${majorVersion})`);
		}

		const policylist: { PolicyList: PolicyListXML } = {
			PolicyList: {
				MajorVersion: policyDoc.major_version,
				MinorVersion: 0,
				ListId: policyDoc.list_id,
				DefaultStop: policyDoc.default_stop,
				ForceVersionUp: policyDoc.force_version_up,
				UpdateTime: moment(Number(policyDoc.updated)).utc().format('YYYY-MM-DDTHH:MM:SS+0000'),
				Priority: policyDoc.priority.map((p) => {
					const entry: PolicyListXML['Priority'][number] = {
						TitleId: p.title_id,
						TaskId: p.task_id,
						Level: p.level as PolicyListXML['Priority'][number]['Level']
					};
					if (p.persistent !== undefined && p.persistent !== null) {
						entry.Persistent = p.persistent;
					}
					if (p.revive !== undefined && p.revive !== null) {
						entry.Revive = p.revive;
					}
					return entry;
				})
			}
		};

		response.set('Content-Type', 'application/xml; charset=utf-8');
		response.send(xmlbuilder.create(policylist, { headless: true }).end({ pretty: true }));
	} catch (error) {
		console.error(error);
		response.sendStatus(500);
	}
});

const router = express.Router();

router.use(restrictHostnames(config.domains.nppl, nppl));

export default router;
