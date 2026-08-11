import xmlbuilder from 'xmlbuilder';
import moment from 'moment';
import express from 'express';
import { config, disabledFeatures } from '@/config-manager';
import { restrictHostnames } from '@/middleware/host-limit';
import { PolicyList } from '../models/policy-list';

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

	let defaultPolicyList;

	if (consoleType === '0') {
		// Original 3DS policy list defaults
		defaultPolicyList = {
			country_code: countryCode,
			major_version: Number(majorVersion),
			list_id: 1891,
			default_stop: false,
			force_version_up: false,
			priority: [
				{
					title_id: '0004003000008f02',
					task_id: 'basho0',
					level: 'HIGH',
					persistent: true,
					revive: true
				},
				{
					title_id: '000400300000bc00',
					task_id: 'OlvNotf',
					level: 'HIGH',
					persistent: true,
					revive: true
				},
				{
					title_id: '000400300000bd00',
					task_id: 'OlvNotf',
					level: 'HIGH',
					persistent: true,
					revive: true
				},
				{
					title_id: '000400300000be00',
					task_id: 'OlvNotf',
					level: 'HIGH',
					persistent: true,
					revive: true
				},
				{
					title_id: '0004003000008f02',
					task_id: 'pl',
					level: 'HIGH',
					persistent: true,
					revive: true
				},
				{
					title_id: '0004013000003400',
					task_id: 'sprelay',
					level: disabledFeatures.spr ? 'STOPPED' : 'HIGH',
					persistent: true,
					revive: true
				}
			],
			updated: Date.now()
		};
	} else {
		// Original Wii U policy list defaults
		defaultPolicyList = {
			country_code: countryCode,
			major_version: Number(majorVersion),
			list_id: 1924,
			default_stop: false,
			force_version_up: false,
			priority: [
				{
					title_id: '0005003010016000',
					task_id: 'olvinfo',
					level: 'EXPEDITE'
				},
				{
					title_id: '0005003010016100',
					task_id: 'olvinfo',
					level: 'EXPEDITE'
				},
				{
					title_id: '0005003010016200',
					task_id: 'olvinfo',
					level: 'EXPEDITE'
				},
				{
					title_id: '000500301001600a',
					task_id: 'olv1',
					level: 'EXPEDITE'
				},
				{
					title_id: '000500301001610a',
					task_id: 'olv1',
					level: 'EXPEDITE'
				},
				{
					title_id: '000500301001620a',
					task_id: 'olv1',
					level: 'EXPEDITE'
				},
				{
					title_id: '0005001010040000',
					task_id: 'oltopic',
					level: 'EXPEDITE'
				},
				{
					title_id: '0005001010040100',
					task_id: 'oltopic',
					level: 'EXPEDITE'
				},
				{
					title_id: '0005001010040200',
					task_id: 'oltopic',
					level: 'EXPEDITE'
				},
				{
					title_id: '000500101005a000',
					task_id: 'Chat',
					level: 'EXPEDITE'
				},
				{
					title_id: '000500101005a100',
					task_id: 'Chat',
					level: 'EXPEDITE'
				},
				{
					title_id: '000500101005a200',
					task_id: 'Chat',
					level: 'EXPEDITE'
				},
				{
					title_id: '000500101004c100',
					task_id: 'plog',
					level: 'EXPEDITE'
				}
			],
			updated: Date.now()
		};
	}

	try {
		const policyDoc = await PolicyList.findOneAndUpdate(
			{
				country_code: countryCode,
				major_version: Number(majorVersion)
			},
			{
				$setOnInsert: defaultPolicyList
			},
			{
				upsert: true,
				new: true,
				setDefaultsOnInsert: true
			}
		);

		const policylist = {
			PolicyList: {
				MajorVersion: policyDoc.major_version,
				MinorVersion: 0,
				ListId: policyDoc.list_id,
				DefaultStop: policyDoc.default_stop,
				ForceVersionUp: policyDoc.force_version_up,
				UpdateTime: moment(Number(policyDoc.updated)).utc().format('YYYY-MM-DDTHH:MM:SS+0000'),
				Priority: policyDoc.priority.map((p: any) => {
					const entry: any = {
						TitleId: p.title_id,
						TaskId: p.task_id,
						Level: p.level
					};
					if (p.persistent !== undefined) entry.Persistent = p.persistent;
					if (p.revive !== undefined) entry.Revive = p.revive;
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
