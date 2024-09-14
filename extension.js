const vscode = require('vscode');
const { OpenAI } = require('openai');

let openai;
let errorHandlerEnabled = false;
let disposable;

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

async function handleError(error) {
    if (!errorHandlerEnabled) return;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant that explains programming errors in a friendly and encouraging way." },
                { role: "user", content: `Please explain this error in a friendly and encouraging way: ${error.message}` }
            ],
            model: "gpt-3.5-turbo",
        });

        vscode.window.showInformationMessage(completion.choices[0].message.content);
    } catch (apiError) {
        vscode.window.showErrorMessage('Failed to get response from ChatGPT: ' + apiError.message);
    }
}

async function toggleErrorHandler(context) {
    try {
        if (!openai) {
            const apiKey = await getApiKey(context);
            openai = new OpenAI({ apiKey });
        }

        errorHandlerEnabled = !errorHandlerEnabled;
        vscode.window.showInformationMessage(`Error Handler is now ${errorHandlerEnabled ? 'enabled' : 'disabled'}.`);

        if (errorHandlerEnabled) {
            startErrorListener();
        } else {
            stopErrorListener();
        }

        // Update the configuration
        await vscode.workspace.getConfiguration().update('friendlyErrorHandler.enableOnStartup', errorHandlerEnabled, vscode.ConfigurationTarget.Global);
    } catch (error) {
        vscode.window.showErrorMessage('Error: ' + error.message);
    }
}

function startErrorListener() {
    if (!disposable) {
        disposable = vscode.languages.onDidChangeDiagnostics((e) => {
            for (const uri of e.uris) {
                const diagnostics = vscode.languages.getDiagnostics(uri);
                for (const diagnostic of diagnostics) {
                    if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                        handleError(diagnostic);
                    }
                }
            }
        });
    }
}

function stopErrorListener() {
    if (disposable) {
        disposable.dispose();
        disposable = null;
    }
}

async function activate(context) {
    console.log('Error Handler Extension is now active!');

    const config = vscode.workspace.getConfiguration('friendlyErrorHandler');
    const enableOnStartup = config.get('enableOnStartup');
    const showWarning = config.get('showWarning');

    if (showWarning) {
        const response = await vscode.window.showWarningMessage(
            'The Friendly Error Handler extension may incur OpenAI API costs when active. Do you want to enable it?',
            'Yes', 'No', 'Don\'t show again'
        );

        if (response === 'Don\'t show again') {
            await config.update('showWarning', false, vscode.ConfigurationTarget.Global);
        }

        if (response === 'Yes') {
            await toggleErrorHandler(context);
        }
    } else if (enableOnStartup) {
        await toggleErrorHandler(context);
    }

    let toggleCommand = vscode.commands.registerCommand('extension.toggleErrorHandler', () => toggleErrorHandler(context));
    context.subscriptions.push(toggleCommand);
}

function deactivate() {
    stopErrorListener();
}

module.exports = {
    activate,
    deactivate
}