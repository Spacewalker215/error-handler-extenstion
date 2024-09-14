const vscode = require('vscode');
const { OpenAI } = require('openai');

async function getApiKey(context) {
    let apiKey = await context.secrets.get('openai-api-key');
    if (!apiKey) {
        apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API Key',
            password: true,
            ignoreFocusOut: true,
            placeHolder: 'sk-...'
        });
        if (apiKey) {
            await context.secrets.store('openai-api-key', apiKey);
        } else {
            throw new Error('API Key is required to use this extension.');
        }
    }
    return apiKey;
}

async function activate(context) {
    console.log('Error Handler Extension is now active!');

    let disposable = vscode.commands.registerCommand('extension.handleError', async function () {
        try {
            const apiKey = await getApiKey(context);

            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active text editor found');
                return;
            }

            let outputChannel = vscode.window.createOutputChannel("Error Handler");
            let document = editor.document;
            let lastLine = document.lineAt(document.lineCount - 1);
            let errorMessage = lastLine.text;

            const openai = new OpenAI({ apiKey });

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful assistant that explains programming errors in a friendly and encouraging way." },
                    { role: "user", content: `Please explain this error in a friendly and encouraging way: ${errorMessage}` }
                ],
                model: "gpt-3.5-turbo",
            });

            vscode.window.showInformationMessage(completion.choices[0].message.content);
        } catch (error) {
            vscode.window.showErrorMessage('Error: ' + error.message);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}