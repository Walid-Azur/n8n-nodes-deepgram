import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { DeepgramClientOptions, createClient } from '@deepgram/sdk';
// Removed unused import: import { Readable } from 'stream';

export class DeepgramTranscriber implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Deepgram Transcriber',
		name: 'deepgramTranscriber',
		icon: 'file:deepgram.svg', // Use the generated SVG icon
		group: ['transform'],
		version: 1,
		// subtitle: '={{$parameter["operation"]}}', // Removed default subtitle
		description: 'Transcribes audio using Deepgram API (pre-recorded)',
		defaults: {
			name: 'Deepgram Transcriber', // This sets the default node label below the icon
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'deepgramApi',
				required: true,
			},
		],
		properties: [
			// Define properties here
			{
				displayName: 'Input Source Type',
				name: 'sourceType',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
						description: 'Transcribe audio from a publicly accessible URL',
						action: 'Transcribe audio from URL',
					},
					{
						name: 'Binary File',
						value: 'file',
						description: 'Transcribe audio from an n8n binary file property',
						action: 'Transcribe audio from file',
					},
				],
				default: 'url',
				description: 'Choose whether to provide an audio URL or use binary data from a previous node',
			},
			// URL Input Property
			{
				displayName: 'Audio URL',
				name: 'audioUrl',
				type: 'string',
				default: 'https://dpgr.am/spacewalk.wav', // Set default test URL
				required: true,
				displayOptions: {
					show: {
						sourceType: [
							'url',
						],
					},
				},
				placeholder: 'https://example.com/audio.wav',
				description: 'Publicly accessible URL of the audio file to transcribe',
			},
			// Binary File Input Property
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						sourceType: [
							'file',
						],
					},
				},
				description: 'Name of the binary property containing the audio file data',
			},
			// Transcription Options
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [ // Common models, user might need to add more if using specific ones
					{ name: 'Base', value: 'base' },
					{ name: 'Enhanced', value: 'enhanced' }, // Older models
					{ name: 'Nova 2', value: 'nova-2' },
					{ name: 'Nova 2 Finance', value: 'nova-2-finance' },
					{ name: 'Nova 2 General', value: 'nova-2-general' },
					{ name: 'Nova 2 Meeting', value: 'nova-2-meeting' },
					{ name: 'Nova 2 Phone Call', value: 'nova-2-phonecall' },
					{ name: 'Nova 2 Video', value: 'nova-2-video' },
					{ name: 'Nova 2 Voicemail', value: 'nova-2-voicemail' },
					{ name: 'Nova 3 (Latest & Greatest)', value: 'nova-3' },
				],
				default: 'nova-2',
				description: 'Choose the transcription model to use. Select the model that best fits your audio type.',
			},
			{
				displayName: 'Additional Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				description: 'Specify additional transcription parameters (e.g., language, punctuate, diarize). Refer to Deepgram documentation.',
				options: [
					{
						displayName: 'Callback URL',
						name: 'callback',
						type: 'string',
						default: '',
						placeholder: 'https://your-webhook-url.com',
						description: 'URL to send results when transcription is complete (asynchronous)',
					},
					{
						displayName: 'Diarize',
						name: 'diarize',
						type: 'boolean',
						default: false,
						description: 'Whether to identify different speakers',
					},
					{
						displayName: 'Keywords',
						name: 'keywords',
						type: 'string',
						default: '',
						placeholder: 'word1:boost,word2:boost',
						description: 'Keywords to boost, format: keyword:boost_value (e.g., n8n:1.5)',
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: 'en',
						description: 'BCP-47 language tag (e.g., en, es, fr)',
					},
					{
						displayName: 'Punctuate',
						name: 'punctuate',
						type: 'boolean',
						default: true,
						description: 'Whether to add punctuation and capitalization',
					},
					{
						displayName: 'Smart Format',
						name: 'smart_format',
						type: 'boolean',
						default: true,
						description: 'Whether to apply smart formatting (dates, numbers, etc.)',
					},
					// ... other options like utterances, redact, detect_language, etc.
				],
			},
			// Output Options
			{
				displayName: 'Append Metadata',
				name: 'appendMetadata',
				type: 'boolean',
				default: false,
				description: 'Whether to include metadata (endpoint, parameters, duration) in the output',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Full Raw Transcript',
						value: 'full',
						description: 'Output the complete response object from Deepgram',
					},
					{
						name: 'Transcript Only',
						value: 'transcriptOnly',
						description: 'Output only the extracted transcript text',
					},
				],
				default: 'full',
				description: 'Choose the desired output format',
			},
			// Added Transcript Field Name property here, inside the main properties array
			{
				displayName: 'Transcript Field Name',
				name: 'transcriptFieldName',
				type: 'string',
				default: 'transcript',
				required: true, // Required when transcriptOnly is selected, but default handles it
				displayOptions: {
					show: {
						outputFormat: [
							'transcriptOnly',
						],
					},
				},
				description: 'Name of the JSON field to store the transcript text in when "Transcript Only" format is selected',
			},
		], // End of properties array
	}; // End of description object

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('deepgramApi');

		const clientOptions: DeepgramClientOptions = {};
		if (credentials.baseUrl) {
			clientOptions.global = { url: credentials.baseUrl as string };
		}

		const deepgram = createClient(credentials.apiKey as string, clientOptions);

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const sourceType = this.getNodeParameter('sourceType', itemIndex, 'url') as string;
				const model = this.getNodeParameter('model', itemIndex, 'nova-3') as string;
				const additionalOptions = this.getNodeParameter('options', itemIndex, {}) as any; // Cast to any for flexibility
				const appendMetadata = this.getNodeParameter('appendMetadata', itemIndex, false) as boolean;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex, 'full') as string;
				const transcriptFieldName = this.getNodeParameter('transcriptFieldName', itemIndex, 'transcript') as string;

				let transcriptionResult;
				let endpointUsed: string;
				const parametersUsed = { model, ...additionalOptions };
				const startTime = Date.now(); // Start timer

				// Determine the base URL
				const baseUrl = clientOptions.global?.url ?? 'https://api.deepgram.com';
				endpointUsed = `${baseUrl}/v1/listen`; // Construct the endpoint URL

				if (sourceType === 'url') {
					const audioUrl = this.getNodeParameter('audioUrl', itemIndex, '') as string;
					if (!audioUrl) {
						throw new NodeOperationError(this.getNode(), 'Audio URL is required when Source Type is URL.', { itemIndex });
					}
					// endpointUsed is now set above

					const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
						{ url: audioUrl },
						{ model, ...additionalOptions },
					);

					if (error) {
						throw new NodeOperationError(this.getNode(), `Deepgram API Error: ${error.message}`, { itemIndex });
					}
					transcriptionResult = result;

				} else { // sourceType === 'file'
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string;
					// Removed unused variable: const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);

					// Convert Buffer to ReadableStream if needed by SDK, or pass buffer directly
					// Check SDK docs for transcribeFile requirements (Buffer or Stream)
					// Assuming transcribeFile accepts Buffer directly based on previous docs:
					const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
					// endpointUsed is now set above

					const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
						buffer,
						{ model, ...additionalOptions },
					);

					if (error) {
						throw new NodeOperationError(this.getNode(), `Deepgram API Error: ${error.message}`, { itemIndex });
					}
					transcriptionResult = result;
				}

				const endTime = Date.now(); // End timer
				const durationMs = endTime - startTime; // Calculate duration

				// Structure the output data based on parameters
				let outputJson: any = { ...items[itemIndex].json }; // Start with original JSON data

				// Ensure transcriptionResult exists before processing
				if (transcriptionResult) {
					if (outputFormat === 'transcriptOnly') {
						// Extract transcript text safely using optional chaining and nullish coalescing
						const transcriptText = transcriptionResult.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
						// Use the custom field name, ensuring it's a valid key
						const fieldName = transcriptFieldName.trim() || 'transcript'; // Default to 'transcript' if empty/whitespace
						outputJson[fieldName] = transcriptText;
					} else { // outputFormat === 'full'
						outputJson.deepgramTranscription = transcriptionResult;
					}
				} else {
					// Handle case where transcriptionResult is unexpectedly null or undefined
					if (outputFormat === 'transcriptOnly') {
						const fieldName = transcriptFieldName.trim() || 'transcript';
						outputJson[fieldName] = ''; // Default to empty string
					} else {
						outputJson.deepgramTranscription = null; // Or handle as appropriate
					}
					// Optionally log a warning here
				}


				if (appendMetadata) {
					outputJson.deepgramMetadata = {
						endpointUsed,
						parametersUsed,
						durationMs,
					};
				}

				// Create the new item, excluding the original binary data
				const newItem: INodeExecutionData = {
					json: outputJson,
					// binary: items[itemIndex].binary, // Do not preserve original binary data
					pairedItem: { item: itemIndex },
				};
				returnData.push(newItem);

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
