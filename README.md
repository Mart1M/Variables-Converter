
# Variables Converter - Figma plugin

This plugin for Figma allows you to extract color variables from Figma files. The variables are presented in formatted JSON and organized according to a design token structure.

## Installation

Here are the steps to get your plugin up and running. You can also find instructions at:

[https://www.figma.com/plugin-docs/plugin-quickstart/](https://www.figma.com/plugin-docs/plugin-quickstart/)

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

1.  First, download Node.js which comes with NPM. This will allow you to install TypeScript and other libraries. You can find the download link here:

[https://nodejs.org/en/download/](https://nodejs.org/en/download/)

2.  Next, install TypeScript using the command:

 `npm install -g typescript`

3.  Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

`npm install --save-dev @figma/plugin-typings` 

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code to provide information about the Figma API while you are writing code, as well as help catch bugs you didn't notice before.

For more information, visit [https://www.typescriptlang.org/](https://www.typescriptlang.org/)

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js) for the browser to run.

We recommend writing TypeScript code using Visual Studio Code:

1.  Download Visual Studio Code if you haven't already: [https://code.visualstudio.com/](https://code.visualstudio.com/).
    
2.  Open this directory in Visual Studio Code.
    
3.  Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item, then select "npm: watch". You will have to do this again every time you reopen Visual Studio Code.
    

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.

## Using the plugin

1.  After installing the plugin, open the Figma document you wish to extract color variables from.
    
2.  Launch the plugin. An interface opens, displaying the formatted JSON.
    
3.  The plugin automatically extracts color variables from the document and displays them as formatted JSON.
    

## Note

This tool is meant to streamline the process of extracting and manipulating color variables from Figma documents. It is always recommended to check and adjust color variables according to your specific needs.