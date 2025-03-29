import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DeepgramApi implements ICredentialType {
	name = 'deepgramApi';
	displayName = 'Deepgram API';
	documentationUrl = 'https://developers.deepgram.com/docs/getting-started'; // Generic getting started guide
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Deepgram API Key',
		},
		{
			displayName: 'Base URL (Optional)',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'e.g., http://localhost:8080',
			description: 'Specify for self-hosted or on-premises deployments. Leave empty for Deepgram Cloud.',
		},
	];
}
