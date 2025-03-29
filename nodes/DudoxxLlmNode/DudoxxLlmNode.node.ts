import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow'; // Removed NodeConnectionType

export class DudoxxLlmNode implements INodeType { // Renamed class
	description: INodeTypeDescription = {
		displayName: 'Dudoxx LLM Node',
		name: 'dudoxxLlmNode',
		icon: 'file:DudoxxLlmNode.icon.svg', // Added icon
		group: ['ai'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}', // Show operation in subtitle
		description: 'Interact with a Dudoxx LLM endpoint',
		defaults: {
			name: 'Dudoxx LLM', // Simplified default name
		},
		inputs: ['main'],
		outputs: ['main'],
		// Define credentials if your LLM needs authentication
		credentials: [
			{
				name: 'dudoxxLlmApi', // Use the name defined in the credential file
				required: true,
			},
		],
		properties: [
			// --- Operation Selection ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate Text',
						value: 'generateText',
						action: 'Generate text based on a prompt',
						// TODO: Add other operations like 'chat', 'toolUse' later
					},
				],
				default: 'generateText',
			},

			// --- LLM Configuration (Conditional based on operation) ---
			{
				displayName: 'Model',
				displayOptions: { // Show only for 'generateText' operation
					show: {
						operation: ['generateText'],
					},
				},
				name: 'model',
				type: 'string',
				default: 'claude-3-haiku-20240307', // More realistic default
				description: 'The LLM model ID to use',
				placeholder: 'e.g., claude-3-opus-20240229',
			},
			{
				displayName: 'Prompt',
				displayOptions: {
					show: {
						operation: ['generateText'],
					},
				},
				name: 'prompt',
				type: 'string',
				default: 'Summarize the following text:\n{{ $json.text }}', // Default prompt using input field
				required: true,
				typeOptions: {
					rows: 5,
				},
				description: 'The prompt to send to the LLM. Use {{$json.fieldName}} for input.',
				placeholder: 'Translate this to French: {{ $json.englishText }}',
			},
			// --- Tool Configuration (Conditional) ---
			{
				displayName: 'Tools (JSON)',
				// TODO: Show only when a 'toolUse' operation is added
				// displayOptions: {
				// 	show: {
				// 		operation: ['toolUse'],
				// 	},
				// },
				name: 'toolsJson',
				type: 'json', // Reverted to lowercase 'json' for TypeScript compatibility
				default: '[]',
				description: 'Define tools available to the LLM in JSON format (tool use not implemented yet)',
				placeholder: '[{"name": "get_weather", "description": "Gets the weather for a location"}]',
				typeOptions: {
					rows: 5,
				},
			},
			// --- Input/Output Handling (Conditional) ---
			{
				displayName: 'Input Field',
				displayOptions: {
					show: {
						operation: ['generateText'], // Relevant for generateText
					},
				},
				name: 'inputField',
				type: 'string',
				default: 'text',
				description: 'Name of the field in the input JSON to use in the prompt',
				placeholder: 'e.g., documentContent',
			},
			{
				displayName: 'Output Field',
				displayOptions: {
					show: {
						operation: ['generateText'], // Relevant for generateText
					},
				},
				name: 'outputField',
				type: 'string',
				default: 'llmResponse',
				description: 'Name of the field to store the LLM response in the output JSON',
				placeholder: 'e.g., summary',
			},
			// TODO: Add more properties for temperature, max tokens, etc.
			// TODO: Add properties specific to 'chat' or 'toolUse' operations later
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0, 'generateText') as string; // Get operation once

		// Iterates over all input items
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const item = items[itemIndex];
				let newItem: INodeExecutionData = { json: { ...item.json }, pairedItem: { item: itemIndex } };

				if (operation === 'generateText') {
					// --- Get Parameters for Generate Text ---
					const model = this.getNodeParameter('model', itemIndex, 'claude-3-haiku-20240307') as string;
					const promptTemplate = this.getNodeParameter('prompt', itemIndex, '') as string;
					const inputField = this.getNodeParameter('inputField', itemIndex, 'text') as string;
					const outputField = this.getNodeParameter('outputField', itemIndex, 'llmResponse') as string;
					// const toolsJson = this.getNodeParameter('toolsJson', itemIndex, '[]') as string; // Tools not used in generateText yet

					// --- Prepare for LLM Call ---
					// Resolve prompt template using item data
					// TODO: Implement robust expression resolution if needed
					const replacementValue = String(item.json[inputField] ?? ''); // Ensure string conversion
					const resolvedPrompt = promptTemplate.replace(`{{ $json.${inputField} }}`, replacementValue);

					// --- Actual LLM Call (Simulated) ---
					// TODO: Replace this with your actual LLM API call logic using this.helpers.httpRequest or axios
					const credentials = await this.getCredentials('dudoxxLlmApi'); // Get credentials
					const apiKey = credentials.apiKey as string; // Cast to string
					const baseUrl = credentials.baseUrl as string; // Cast to string

					// Removed console.log statements causing TS errors
					const llmResult = `Simulated LLM response for prompt "${resolvedPrompt.substring(0, 30)}..." using model ${model} (API Key: ${apiKey.substring(0, 3)}... Base URL: ${baseUrl})`; // Include credential info in simulation

					// Add the LLM result to the specified output field
					newItem.json[outputField] = llmResult;

				} else {
					// Handle other operations later
					throw new NodeOperationError(this.getNode(), `Operation "${operation}" not implemented yet.`, { itemIndex });
				}

				returnData.push(newItem);

			} catch (error) {
				// Handle errors
				if (this.continueOnFail()) {
					returnData.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		// Return the modified items
		return [returnData];
	}
}
