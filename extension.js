const vscode = require('vscode');
const { OpenAI } = require('openai');
const child_process = require('child_process');

/** @type {OpenAI} */
let openai;
let errorHandlerEnabled = false;
/** @type {vscode.OutputChannel} */
let outputChannel;

/**
 * @param {vscode.ExtensionContext} context
 * @returns {Promise<string>}
 */
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

/**
 * @param {string} errorMessage
 */
async function handleError(errorMessage) {
    if (!errorHandlerEnabled) return;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant that explains programming errors in a friendly and encouraging way." },
                { role: "user", content: `Please explain this error in a friendly and encouraging way: ${errorMessage}` }
            ],
            model: "gpt-3.5-turbo",
        });

        const response = completion.choices[0].message.content;
        outputChannel.appendLine('\n**************************************************');
        outputChannel.appendLine('AI Assistant:');
        outputChannel.appendLine(response);
        outputChannel.appendLine('**************************************************\n');
        outputChannel.show(true);
    } catch (apiError) {
        vscode.window.showErrorMessage('Failed to get response from ChatGPT: ' + apiError.message);
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function toggleErrorHandler(context) {
    try {
        if (!openai) {
            const apiKey = await getApiKey(context);
            openai = new OpenAI({ apiKey });
        }

        errorHandlerEnabled = !errorHandlerEnabled;
        outputChannel.appendLine(`Error Handler is now ${errorHandlerEnabled ? 'enabled' : 'disabled'}.`);
        outputChannel.show(true);

        await vscode.workspace.getConfiguration().update('friendlyErrorHandler.enableOnStartup', errorHandlerEnabled, vscode.ConfigurationTarget.Global);
    } catch (error) {
        vscode.window.showErrorMessage('Error: ' + error.message);
    }
}

/**
 * @param {string} command
 * @returns {Promise<void>}
 */
function runCode(command) {
    return new Promise((resolve) => {
        outputChannel.appendLine('Running code...');
        outputChannel.show(true);
        
        const process = child_process.exec(command, { cwd: vscode.workspace.rootPath });
        
        process.stdout.on('data', (data) => {
            outputChannel.append(data.toString());
        });
        
        process.stderr.on('data', (data) => {
            const errorMessage = data.toString();
            outputChannel.append(errorMessage);
            if (errorHandlerEnabled) {
                handleError(errorMessage);
            }
        });
        
        process.on('close', (code) => {
            if (code !== 0) {
                outputChannel.appendLine(`Process exited with code ${code}`);
            }
            resolve();
        });
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    console.log('Error Handler Extension is now active!');

    outputChannel = vscode.window.createOutputChannel("Friendly Error Handler");

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

    // Register a command to run code with the Error Handler
    let runCodeCommand = vscode.commands.registerCommand('extension.runCodeWithErrorHandler', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const fileName = document.fileName;
            const fileExtension = fileName.split('.').pop();
            
            let command;
            switch (fileExtension) {
                case 'js':
                    command = `node "${fileName}"`;
                    break;
                case 'py':
                    command = `python "${fileName}"`;
                    break;
                // Add more cases for other file types as needed
                default:
                    vscode.window.showErrorMessage('Unsupported file type');
                    return;
            }
            
            await runCode(command);
        } else {
            vscode.window.showErrorMessage('No active text editor found');
        }
    });
    context.subscriptions.push(runCodeCommand);
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}

module.exports = {
    activate,
    deactivate
}