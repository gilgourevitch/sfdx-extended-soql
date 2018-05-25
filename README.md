sfdx-extended-soql
==================

Extension to the standard SOQL queries

[![Version](https://img.shields.io/npm/v/sfdx-extended-soql.svg)](https://npmjs.org/package/sfdx-extended-soql)
[![CircleCI](https://circleci.com/gh/gilgourevitch/sfdx-extended-soql/tree/master.svg?style=shield)](https://circleci.com/gh/gilgourevitch/sfdx-extended-soql/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/gilgourevitch/sfdx-extended-soql?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sfdx-extended-soql/branch/master)
[![Codecov](https://codecov.io/gh/gilgourevitch/sfdx-extended-soql/branch/master/graph/badge.svg)](https://codecov.io/gh/gilgourevitch/sfdx-extended-soql)
[![Greenkeeper](https://badges.greenkeeper.io/gilgourevitch/sfdx-extended-soql.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/gilgourevitch/sfdx-extended-soql/badge.svg)](https://snyk.io/test/github/gilgourevitch/sfdx-extended-soql)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-extended-soql.svg)](https://npmjs.org/package/sfdx-extended-soql)
[![License](https://img.shields.io/npm/l/sfdx-extended-soql.svg)](https://github.com/gilgourevitch/sfdx-extended-soql/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-extended-soql
$ sfdx-extended-soql COMMAND
running command...
$ sfdx-extended-soql (-v|--version|version)
sfdx-extended-soql/0.0.1 darwin-x64 node-v9.2.0
$ sfdx-extended-soql --help [COMMAND]
USAGE
  $ sfdx-extended-soql COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx-extended-soql gilgou:soql`](#sfdx-extended-soql-gilgousoql)

## `sfdx-extended-soql gilgou:soql`

Generates a SOQL query with all explicit fieldnames instead of '*'

```
USAGE
  $ sfdx-extended-soql gilgou:soql

OPTIONS
  -a, --fieldaccess=fieldaccess                   Field access : all, or updateable
  -f, --outputformat=outputformat                 Output format of the results (empty, csv)
  -q, --query=query                               Query to execute (select * from Account)
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx gilgou:soql --targetusername myOrg@example.com --query "select * from Account"
     select Id,IsDeleted,MasterRecordId,Name,Type,RecordTypeId,ParentId... from Account
  

  $ sfdx gilgou:soql --targetusername myOrg@example.com --fieldaccess updateable --query "select * from Account"
     select Name,Type,RecordTypeId,ParentId... from Account
```

_See code: [src/commands/gilgou/soql.ts](https://github.com/gilgourevitch/sfdx-extended-soql/blob/v0.0.1/src/commands/gilgou/soql.ts)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
