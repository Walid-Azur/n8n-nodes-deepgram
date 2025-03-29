# n8n-nodes-deepgram

![Deepgram N8N Hero](./images/deepgram-n8n-hero.png)

This is an n8n community node package for interacting with the [Deepgram](https://deepgram.com/) API.

It currently includes the following node:

*   **Deepgram Transcriber:** Transcribes pre-recorded audio files using the Deepgram API. Supports providing audio via URL or binary file input.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

1.  Go to **Settings > Community Nodes**.
2.  Select **Install**.
3.  Enter `n8n-nodes-deepgram` in the **Enter package name** field.
4.  Agree to the risks of using community nodes: select **I understand the risks, and I want to proceed**.
5.  Select **Install**.

After installing the node, you can use it like any other node. n8n displays the node in the node panel under **Community** > **Installed**.

## Operations

![Deepgram N8N Flow](./images/deepgram-n8n-flow.png)

*   **Deepgram Transcriber:**
    *   Transcribe audio from a public URL.
    *   Transcribe audio from an n8n binary file property.
    *   Supports various Deepgram models (including Nova 2 and Nova 3).
    *   Allows specifying additional options like language, punctuation, diarization, smart formatting, keywords, and callback URL.
    *   Optionally append metadata (endpoint, parameters, duration) to the output.
    *   Choose between outputting the full raw transcript or just the transcript text.

## Credentials

Requires Deepgram API credentials.

1.  Go to your [Deepgram Console](https://console.deepgram.com/).
2.  Navigate to **API Keys**.
3.  Create a new API key or use an existing one.
4.  In n8n, create new credentials for the Deepgram Transcriber node.
5.  Enter your Deepgram API Key.
6.  (Optional) If using a self-hosted or custom Deepgram endpoint, enter the Base URL.

## Compatibility

Tested with n8n version 1.x.

## Usage

1.  Install the package in your n8n instance.
2.  Add the **Deepgram Transcriber** node to your workflow.
3.  Configure the node properties:
    *   Select the **Input Source Type** (URL or Binary File).
    *   Provide the **Audio URL** or **Binary Property** name.
    *   Choose the desired **Model**.
    *   Configure **Additional Options** as needed (language, punctuate, etc.).
    *   Select the **Output Format**.
    *   If using "Transcript Only" format, optionally specify a custom **Transcript Field Name** (defaults to `transcript`).
4.  Connect the node and run your workflow.

## Resources

*   [n8n Community Nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
*   [Deepgram API Documentation](https://developers.deepgram.com/docs)
*   [GitHub Repository: Walid-Azur/n8n-nodes-deepgram](https://github.com/Walid-Azur/n8n-nodes-deepgram)

## Consulting & Services

For custom node development, workflow automation consulting, or other n8n-related services, please contact:

**Walid Boudabbous** (Acceleate Consulting Estonia)  
Email: [walid@acceleate.com](mailto:walid@acceleate.com)

## License

[MIT](LICENSE.md)
