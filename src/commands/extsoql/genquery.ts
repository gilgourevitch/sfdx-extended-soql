import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-extended-soql', 'genquery');

export default class Genquery extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx extsoql:genquery --targetusername myOrg@example.com --query "Select * From Account"
  Select Id,IsDeleted,MasterRecordId,Name,Type, ... From Account`,

  `$ sfdx extsoql:genquery --targetusername myOrg@example.com --fieldaccess updateable --query "Select * From Account"
  Select Name,Type,RecordTypeId,ParentId, ... From Account`
  ];

  protected static flagsConfig = {
    // flag with a value (-o, --sobjecttype=VALUE)
    query: flags.string({char: 'q', description: messages.getMessage('queryFlagDescription')}),
    fieldaccess: flags.string({char: 'a', description: messages.getMessage('fieldAccessFlagDescription')})
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

    const conn = this.org.getConnection();

    var queryPattern = /from ([a-zA-Z0-9_]*)/i
    var outputQuery = query;

    var matches = query.match(queryPattern);
    if(
      (matches == undefined)
      || (matches.length < 2)
    ){
      throw new SfdxError(messages.getMessage('errorMalformedQuery', [query]));
    }

    if(query.indexOf('*') > -1){
      var fields = await this.getFields(matches[1], fieldAccess).then(function (result){
        return result;
      });

      outputQuery = query.replace('*', fields);
    }

    this.ux.log(outputQuery);

    return {
      "query": outputQuery
    };
  }

  /**
   * getFieldListFromResult
   */
  public getFieldListFromResult(soqlResult) {
    var fieldList = [];
    for(var key in soqlResult){
      if(key != 'attributes'){
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
  public async getFields(sObjectType, fieldAccess): Promise<any>{
    const conn = this.org.getConnection();
    const fieldAccesses = fieldAccess.split(',');

    const fieldList = await conn.describe(sObjectType).then(function(result){

      var fieldList = [];
      for(var i = 0; i < result.fields.length; i++){
        let includeField = false;
        if(fieldAccess == 'all') includeField = true;
        else{
          includeField = true;
          fieldAccesses.forEach(fieldAccess => {
            includeField = includeField && result.fields[i][fieldAccess];
          });
        }

        if(includeField){
          fieldList.push(result.fields[i]['name']);
        }
      }
      return fieldList.join(',');
    });
    return Promise.resolve(fieldList);
  }
}
