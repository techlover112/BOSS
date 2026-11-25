import { disabledFeatures } from '@/config-manager';
import type { IPolicyList, IPolicyListPriority } from '@/types/mongoose/policy-list';

// * The built-in policy list for each console: major version 3 is the 3DS, major version 1 is the Wii U.
// * New policy lists start from these, and an entry a task replaced falls back to these when the task goes away

export function getDefaultPolicyList(countryCode: string, majorVersion: number): IPolicyList {
	let defaultPolicyList: IPolicyList;

	if (majorVersion === 3) {
		// Original 3DS policy list defaults
		defaultPolicyList = {
			country_code: countryCode,
			major_version: majorVersion,
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
			updated: BigInt(Date.now())
		};
	} else {
		// Original Wii U policy list defaults
		defaultPolicyList = {
			country_code: countryCode,
			major_version: majorVersion,
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
			updated: BigInt(Date.now())
		};
	}

	return defaultPolicyList;
}

export function getDefaultPolicyListPriority(majorVersion: number, titleID: string, taskID: string): IPolicyListPriority | null {
	return getDefaultPolicyList('', majorVersion).priority.find(p => p.title_id === titleID && p.task_id === taskID) ?? null;
}
