import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-extended-soql', 'query');

export default class Query extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx extsoql:query --targetusername myOrg@example.com --query "Select * From Account"
  | Id | IsDeleted | MasterRecordId | Name | Type | RecordTypeId | ...
  | 001i00000093gBiAAI | false | null | GenePoint5 | Customer - Channel | null | ...
  `,
    `$ sfdx extsoql:query --targetusername myOrg@example.com --fieldaccess updateable --query "Select * From Account"
  | Name | Type | RecordTypeId | ParentId | BillingStreet | ...
  | GenePoint5 | Customer - Channel | null | null | 345 Shoreline Park
Mountain View, CA 94043
USA | ...
  `,
    `$ sfdx extsoql:query --targetusername myOrg@example.com --fieldaccess updateable --query "Select * From Account" --format csv
  "Name","Type","RecordTypeId","ParentId","BillingStreet" ...
  "GenePoint5","Customer - Channel","null","null","345 Shoreline Park
Mountain View, CA 94043
USA", ...
  `,
    `$ sfdx extsoql:query --targetusername myOrg@example.com --fieldaccess updateable --query "Select * From Account" --format tree
  {"records":[{"attributes":{"type":"Account","referenceId":"AccountRef1"},"Name":"GenePoint5","Type":"Customer - Channel","RecordTypeId":null,"ParentId":null,"BillingStreet":"345 Shoreline Park\nMountain View, CA 94043\nUSA", ... }]}
  `

  ];

  protected static flagsConfig = {
    // flag with a value (-o, --sobjecttype=VALUE)
    query: flags.string({ char: 'q', description: messages.getMessage('queryFlagDescription') }),
    fieldaccess: flags.string({ char: 'a', description: messages.getMessage('fieldAccessFlagDescription') }),
    outputformat: flags.string({ char: 'f', description: messages.getMessage('outputFormatFlagDescription') })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  // protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    const query = this.flags.query || '';
    const fieldAccess = this.flags.fieldaccess || 'all';
    const format = this.flags.outputformat || '';

    const conn = this.org.getConnection();

    var queryPattern = /from ([a-zA-Z0-9_]*)/i
    var outputQuery = query;

    var matches = query.match(queryPattern);
    if (
      (matches == undefined)
      || (matches.length < 2)
    ) {
      throw new SfdxError(messages.getMessage('errorMalformedQuery', [query]));
    }

    if (query.indexOf('*') > -1) {
      var fields = await this.getFields(matches[1], fieldAccess).then(function (result) {
        return result;
      });

      outputQuery = query.replace('*', fields);
    }

    // this.ux.log(outputQuery);

    var soqlResults = await conn.query(outputQuery).then(function (result) {
      return result;
    });

    if (format == 'tree') {
      this.exportResults(soqlResults["records"]);
    } else {
      this.printResults(soqlResults, format);
    }

    return {
      "query": outputQuery,
      "results": soqlResults
    };
  }


  /**
   * exportResults
   */
  public exportResults(results) {
    var output = {
      "records": []
    };

    for (var i = 0; i < results.length; i++) {
      var row: any = {};
      row.attributes = {
        "type": results[i].attributes.type,
        "referenceId": results[i].attributes.type + "Ref" + (i + 1)
      }

      for (var key in results[i]) {
        if (key != 'attributes') {
          row[key] = results[i][key];
        }
      }

      output.records.push(row);
    }

    this.ux.log(JSON.stringify(output));
  }

  /**
   * printResults
   */
  public printResults(results, format) {
    var separator = '';
    var lineStart = '';
    var lineEnd = '';
    var nullValue = '';
    switch (format) {
      case 'bulkcsv':
        nullValue = '#N/A';
      case 'csv':
        separator = '","';
        lineStart = '"';
        lineEnd = '"';
        break;
      default:
        separator = ' | ';
        lineStart = '| ';
        lineEnd = ' |';
        break;
    }

    lineEnd += '\n';

    var outputStr = '';
    var resultFieldList = this.getFieldListFromResult(results['records'][0]);
    outputStr = lineStart + resultFieldList.join(separator) + lineEnd;

    for (var i = 0; i < results['records'].length; i++) {
      var row = '';

      for (var j = 0; j < resultFieldList.length; j++) {
        if (row != '') {
          row += separator;
        }

        let value = results['records'][i][resultFieldList[j]];
        if (value || (typeof value == 'number') || (typeof value == 'boolean'))
          row += value;
        else
          row += nullValue;
      }

      outputStr += lineStart + row + lineEnd;
    }

    this.ux.log(outputStr);
  }

  /**
   * getFieldListFromResult
   */
  public getFieldListFromResult(soqlResult) {
    var fieldList = [];
    for (var key in soqlResult) {
      if (key != 'attributes') {
        fieldList.push(key);
      }
    }

    return fieldList;
  }
  /**
   * getFields : retrieve all fields of sObjectType object
   * sObjectType : object to retrieve fields from
   * fieldAccess : fields access to retrieve :
   *                - all : retrieve all fields
   *                - updateable : retrieve only fields that the current user can update
   *                - creatable : retrieve only fields that the current user can create
   *                You can send multiple
   */
  public async getFields(sObjectType, fieldAccess): Promise<any> {
    const conn = this.org.getConnection();
    const fieldAccesses = fieldAccess.split(',');

    const fieldList = await conn.describe(sObjectType).then(function (result) {

      var fieldList = [];
      for (var i = 0; i < result.fields.length; i++) {
        let includeField = false;
        if (fieldAccess == 'all') includeField = true;
        else {
          includeField = true;
          fieldAccesses.forEach(fieldAccess => {
            includeField = includeField && result.fields[i][fieldAccess];
          });
        }

        if (includeField) {
          fieldList.push(result.fields[i]['name']);
        }
      }
      return fieldList.join(',');
    });
    return Promise.resolve(fieldList);
  }

  public writeFile(filename, content) {
    var fs = require("fs");
    fs.writeFile(filename, content, (err) => {
      if (err) {
        console.error(err);
        return;
      };
      console.log("File has been created");
    });
  }
}
