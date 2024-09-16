const vscode = require('vscode');
const { OpenAI } = require('openai');
const child_process = require('child_process');

let openai;
let errorHandlerEnabled = false;
let outputChannel;
let isRunning = false;

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

async function handleError(errorMessage) {
    console.log('Handling error:', errorMessage, 'Handler enabled:', errorHandlerEnabled);
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

function runCode(command) {
    return new Promise((resolve) => {
        console.log('Running command:', command);
        outputChannel.appendLine('Running code...');
        outputChannel.show(true);
        
        const process = child_process.exec(command, { cwd: vscode.workspace.rootPath });
        
        process.stdout.on('data', (data) => {
            outputChannel.append(data.toString());
        });
        
        process.stderr.on('data', (data) => {
            const errorMessage = data.toString();
            console.log('Error detected:', errorMessage);
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

async function runCodeWithErrorHandler(context) {
    if (isRunning) return;
    isRunning = true;

    try {
        if (!errorHandlerEnabled) {
            await toggleErrorHandler(context);
        }

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
                default:
                    vscode.window.showErrorMessage('Unsupported file type');
                    return;
            }
            
            await runCode(command);
        } else {
            vscode.window.showErrorMessage('No active text editor found');
        }
    } finally {
        isRunning = false;
    }
}

function activate(context) {
    console.log('Friendly Error Handler Extension is now active!');

    outputChannel = vscode.window.createOutputChannel("Friendly Error Handler");

    const config = vscode.workspace.getConfiguration('friendlyErrorHandler');
    const enableOnStartup = config.get('enableOnStartup');
    const showWarning = config.get('showWarning');

    if (showWarning) {
        vscode.window.showWarningMessage(
            'The Friendly Error Handler extension may incur OpenAI API costs when active. Do you want to enable it?',
            'Yes', 'No', 'Don\'t show again'
        ).then(async response => {
            if (response === 'Don\'t show again') {
                await config.update('showWarning', false, vscode.ConfigurationTarget.Global);
            }

            if (response === 'Yes') {
                await toggleErrorHandler(context);
            }
        });
    } else if (enableOnStartup) {
        toggleErrorHandler(context);
    }

    let toggleCommand = vscode.commands.registerCommand('extension.toggleErrorHandler', () => toggleErrorHandler(context));
    context.subscriptions.push(toggleCommand);

    let runWithHandlerCommand = vscode.commands.registerCommand('extension.runCodeWithErrorHandler', () => runCodeWithErrorHandler(context));
    context.subscriptions.push(runWithHandlerCommand);
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};