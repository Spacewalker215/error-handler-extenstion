const vscode = require('vscode');
const { OpenAI } = require('openai');

function activate(context) {
    console.log('Error Handler Extension is now active!');

    let disposable = vscode.commands.registerCommand('extension.handleError', async function () {
        // Get the active text editor
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found');
            return;
        }

        // Get the last line from the output channel (assuming it's the error message)
        let outputChannel = vscode.window.createOutputChannel("Error Handler");
        let document = editor.document;
        let lastLine = document.lineAt(document.lineCount - 1);
        let errorMessage = lastLine.text;

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Call ChatGPT API
        try {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful assistant that explains programming errors in a friendly and encouraging way." },
                    { role: "user", content: `Please explain this error in a friendly and encouraging way: ${errorMessage}` }
                ],
                model: "gpt-3.5-turbo",
            });

            // Show the ChatGPT response
            vscode.window.showInformationMessage(completion.choices[0].message.content);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to get response from ChatGPT: ' + error.message);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}