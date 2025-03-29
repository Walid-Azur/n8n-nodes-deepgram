import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	// Needed for binary output
	IBinaryKeyData,
} from 'n8n-workflow';

import { DeepgramClientOptions, createClient } from '@deepgram/sdk';
// import { Readable } from 'stream'; // No longer needed

// Helper function from Deepgram docs to convert stream to buffer
// Note: This might need adjustment based on how n8n expects binary data creation
async function getAudioBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = []; // Explicitly type chunks

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) { // Ensure value is not undefined
			chunks.push(value);
		}
	}

	// Combine chunks into a single Uint8Array
	let totalLength = 0;
	chunks.forEach(chunk => {
		totalLength += chunk.length;
	});

	const combined = new Uint8Array(totalLength);
	let offset = 0;
	chunks.forEach(chunk => {
		combined.set(chunk, offset);
		offset += chunk.length;
	});

	return Buffer.from(combined.buffer);
}


export class DeepgramSpeaker implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Deepgram Speaker (TTS)',
		name: 'deepgramSpeaker',
		icon: 'file:deepgramSpeaker.icon.svg', // Placeholder icon name
		group: ['transform'], // Or maybe 'output'?
		version: 1,
		description: 'Generates audio from text using Deepgram Speak API (Text-to-Speech)',
		defaults: {
			name: 'Deepgram Speaker',
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
			// --- Input Text ---
			{
				displayName: 'Text to Speak',
				name: 'text',
				type: 'string',
				default: '',
				required: true,
				typeOptions: {
					rows: 4,
				},
				description: 'The text to be converted into speech (max 2000 characters)',
				placeholder: 'Enter the text you want to synthesize...',
			},
			// --- Voice Model ---
			{
				displayName: 'Voice Model',
				name: 'model',
				type: 'options',
				options: [
					// Sorted Alphabetically by name
					{ name: 'Angus (Ireland Male)', value: 'aura-angus-en' },
					{ name: 'Arcas (US Male)', value: 'aura-arcas-en' },
					{ name: 'Asteria (US Female)', value: 'aura-asteria-en' },
					{ name: 'Athena (UK Female)', value: 'aura-athena-en' },
					{ name: 'Helios (UK Male)', value: 'aura-helios-en' },
					{ name: 'Hera (US Female)', value: 'aura-hera-en' },
					{ name: 'Luna (US Female)', value: 'aura-luna-en' },
					{ name: 'Orion (US Male)', value: 'aura-orion-en' },
					{ name: 'Orpheus (US Male)', value: 'aura-orpheus-en' },
					{ name: 'Perseus (US Male)', value: 'aura-perseus-en' },
					{ name: 'Stella (US Female)', value: 'aura-stella-en' },
					{ name: 'Zeus (US Male)', value: 'aura-zeus-en' },
				],
				default: 'aura-asteria-en', // Default from docs
				required: true,
				description: 'Choose the voice model for speech synthesis',
			},
			// --- Audio Output Options ---
			{
				displayName: 'Audio Options', // Intentionally re-typed
				name: 'audioOptions',
				type: 'collection',
				placeholder: 'Add Audio Option',
				default: {},
				description: 'Configure the output audio format',
				options: [
					{
						displayName: 'Encoding',
						name: 'encoding',
						type: 'options',
						options: [
							{ name: 'MP3 (Default)', value: 'mp3' },
							{ name: 'Linear16', value: 'linear16' },
							{ name: 'Mu-Law', value: 'mulaw' },
						],
						default: 'mp3',
						description: 'Audio encoding format for the output',
					},
					{
						displayName: 'Container',
						name: 'container',
						type: 'options',
						options: [
							{ name: 'WAV', value: 'wav' },
							{ name: 'MP3', value: 'mp3' },
						],
						default: 'mp3',
						description: 'Container format for the output audio file',
					},
					{
						displayName: 'Sample Rate',
						name: 'sample_rate',
						type: 'number',
						typeOptions: {
							minValue: 8000,
						},
						default: 24000,
						description: 'Sample rate of the output audio (e.g., 8000, 16000, 24000)',
					},
					{
						displayName: 'Bit Rate',
						name: 'bit_rate',
						type: 'number',
						typeOptions: {
							minValue: 32000,
						},
						default: 128000,
						description: 'Bit rate for compressed audio formats (e.g., MP3)',
					},
				],
			},
			// --- Output Property Name ---
			{
				displayName: 'Output Binary Property',
				name: 'outputBinaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property to store the generated audio data',
			},
			// --- Output Filename ---
			{
				displayName: 'Output Filename',
				name: 'outputFilename',
				type: 'string',
				default: '',
				description: 'Optional filename for the output binary data (e.g., "speech.mp3"). If empty, a default name will be generated.',
				placeholder: 'speech.mp3',
			},
		],
	};

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
				const textToSpeak = this.getNodeParameter('text', itemIndex, '') as string;
				const model = this.getNodeParameter('model', itemIndex, 'aura-asteria-en') as string;
				const audioOptions = this.getNodeParameter('audioOptions', itemIndex, {}) as any;
				const outputPropertyName = this.getNodeParameter('outputBinaryPropertyName', itemIndex, 'data') as string;
				let outputFilename = this.getNodeParameter('outputFilename', itemIndex, '') as string;

				if (!textToSpeak) {
					throw new NodeOperationError(this.getNode(), 'Text to Speak cannot be empty.', { itemIndex });
				}
				if (textToSpeak.length > 2000) {
					throw new NodeOperationError(this.getNode(), 'Text to Speak cannot exceed 2000 characters.', { itemIndex });
				}

				// Prepare options for the Deepgram SDK call
				const speakOptions: any = {
					model: model,
				};
				if (audioOptions.encoding) speakOptions.encoding = audioOptions.encoding;
				if (audioOptions.container) speakOptions.container = audioOptions.container;
				if (audioOptions.sample_rate) speakOptions.sample_rate = audioOptions.sample_rate;
				if (audioOptions.bit_rate) speakOptions.bit_rate = audioOptions.bit_rate;

				// Call Deepgram Speak API
				const response = await deepgram.speak.request(
					{ text: textToSpeak },
					speakOptions,
				);

				const headers = await response.getHeaders();
				const stream = await response.getStream();

				// Check headers for non-successful status codes first
				// Use headers.get() method for standard Headers object
				const contentType = headers?.get('content-type') ?? '';
				const isLikelyAudio = contentType.startsWith('audio/');

				if (!stream || !isLikelyAudio) {
					let errorDetails = 'Unknown error generating audio stream.';
					if (stream) {
						// If there's a stream but it's not audio, it might contain the JSON error
						try {
							const errorBuffer = await getAudioBuffer(stream);
							const errorJson = JSON.parse(errorBuffer.toString('utf-8'));
							errorDetails = `Deepgram API Error: ${JSON.stringify(errorJson)}`;
						} catch (e) {
							errorDetails = `Deepgram API returned non-audio content (Content-Type: ${contentType}). Could not parse error details.`;
						}
					} else {
						// No stream at all
						errorDetails = `Deepgram API Error: No audio stream received. Headers: ${JSON.stringify(headers)}`;
					}
					throw new NodeOperationError(this.getNode(), errorDetails, { itemIndex });
				}

				// Convert valid audio stream to buffer
				const audioBuffer = await getAudioBuffer(stream);

				// Determine MIME type based on options (best effort)
				let mimeType = 'audio/mpeg'; // Default
				if (audioOptions.container === 'wav' || (audioOptions.encoding === 'linear16' && !audioOptions.container)) {
					mimeType = 'audio/wav';
				} else if (audioOptions.encoding === 'mulaw' && !audioOptions.container) {
					mimeType = 'audio/basic'; // Common for mu-law
				} else if (audioOptions.container === 'mp3' || audioOptions.encoding === 'mp3') {
					mimeType = 'audio/mpeg';
				}
				// Add more mappings if needed

				// Determine default filename if not provided
				if (!outputFilename) {
					const extension = mimeType.split('/')[1] || 'bin'; // Get extension from MIME type
					outputFilename = `deepgram_output.${extension}`;
				}

				// Create binary data object for n8n
				const binaryData: IBinaryKeyData = {};
				// Pass the buffer directly, along with filename and mimeType
				binaryData[outputPropertyName] = await this.helpers.prepareBinaryData(audioBuffer, outputFilename, mimeType);


				// Prepare the output item
				const newItem: INodeExecutionData = {
					json: items[itemIndex].json, // Keep original JSON data
					binary: binaryData,
					pairedItem: { item: itemIndex },
				};
				returnData.push(newItem);

			} catch (error) {
				if (this.continueOnFail()) {
					// Return original item with error attached
					returnData.push({ json: items[itemIndex].json, binary: items[itemIndex].binary, error, pairedItem: itemIndex });
					continue;
				}
				// Throw error if not continuing on fail
				if (error instanceof NodeOperationError) {
					throw error; // Re-throw known NodeOperationErrors
				}
				// Wrap other errors
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
