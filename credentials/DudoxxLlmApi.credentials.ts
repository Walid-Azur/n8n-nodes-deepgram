import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class DudoxxLlmApi implements ICredentialType {
	name = 'dudoxxLlmApi'; // Unique name for the credential type
	displayName = 'Dudoxx LLM API';
	documentationUrl = 'https://docs.dudoxx.com/api'; // Replace with actual documentation URL if available
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true }, // Mark as password field
			default: '',
			required: true,
			description: 'Your Dudoxx LLM API Key',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.dudoxx.com/llm/v1', // Replace with the actual default base URL
			required: true,
			description: 'The base URL of the Dudoxx LLM API endpoint',
			placeholder: 'e.g., https://your-instance.dudoxx.com/llm/v1',
		},
		// Add other necessary credential properties here (e.g., headers, specific auth methods)
	];
}
