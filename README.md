## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:
# Friendly Error Handler

## Overview

Friendly Error Handler is a Visual Studio Code extension that provides friendly, encouraging explanations for coding errors using OpenAI's GPT model. It supports multiple programming languages and aims to make debugging a more positive and educational experience for developers of all levels.

## Features

- 🌟 Supports multiple programming languages
- 🔗 Integrates with VS Code's built-in 'Run' and 'Run in Terminal' commands
- 🤖 Provides friendly, AI-generated explanations for coding errors
- 🔄 Easy toggle on/off functionality
- ⌨️ Customizable keybinding (default: `Ctrl+Alt+X` or `Cmd+Alt+X` on Mac)

## Supported Languages

| Language   | File Extension |
|------------|----------------|
| JavaScript | .js            |
| Python     | .py            |
| Java       | .java          |
| C          | .c             |
| C++        | .cpp           |
| C#         | .cs            |
| Go         | .go            |
| Ruby       | .rb            |
| PHP        | .php           |
| TypeScript | .ts            |
| Swift      | .swift         |
| R          | .r             |
| Scala      | .scala         |

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac)
3. Search for "Friendly Error Handler"
4. Click Install

## Setup

1. After installation, you'll be prompted to enter your OpenAI API key.
2. If you don't have an API key, obtain one from [OpenAI's website](https://openai.com/api/).
3. The extension will securely store your API key for future use.

## Usage

1. Open a file in one of the supported programming languages.
2. Use the keybinding (`Ctrl+Alt+X` or `Cmd+Alt+X` on Mac) to run your code with error handling enabled.
3. If an error occurs, you'll see a friendly explanation in the "Friendly Error Handler" output channel.

Alternative methods:
- Use the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and search for "Run Code with Friendly Error Handler"
- Toggle the error handler on/off using the status bar item or the command palette

## Configuration

You can configure the extension in your VS Code settings:

| Setting                                  | Description                                             | Default |
|------------------------------------------|---------------------------------------------------------|---------|
| `friendlyErrorHandler.enableOnStartup`   | Enable the Friendly Error Handler on VS Code startup    | `false` |
| `friendlyErrorHandler.showWarning`       | Show a warning about potential API usage costs on startup | `true`  |

## Note on API Usage

This extension uses OpenAI's API to generate error explanations. While efforts have been made to minimize API calls, please be aware that using this extension may incur costs associated with your OpenAI API usage. You can monitor your usage on the [OpenAI website](https://openai.com/api/).

## Feedback and Contributions

Your feedback and contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue on our [GitHub repository](https://github.com/Spacewalker215/error-handler-extenstion).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or need support, please open an issue on our GitHub repository

Happy coding, and may your debugging sessions be friendlier than ever! 😊🚀
\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements
Open A.I API Key