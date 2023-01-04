import { t } from 'testcafe';
import * as fs from 'fs';
import { MyRedisDatabasePage } from '../pageObjects';

const myRedisDatabasePage = new MyRedisDatabasePage();

export class DatabasesActions {
    /**
     * Verify that databases are displayed
     * @param databases The list of databases to verify
     */
    async verifyDatabasesDisplayed(databases: string[]): Promise<void> {
        for (const db of databases) {
            const databaseName = myRedisDatabasePage.dbNameList.withText(db);
            await t.expect(databaseName.exists).ok(`"${db}" database doesn't exist`);
        }
    }

    /**
     * Import database using file
     * @param fileParameters The arguments of imported file
     */
    async importDatabase(fileParameters: ImportDatabaseParameters): Promise<void> {
        await t
            .click(myRedisDatabasePage.importDatabasesBtn)
            .setFilesToUpload(myRedisDatabasePage.importDatabaseInput, [fileParameters.path])
            .click(myRedisDatabasePage.submitImportBtn)
            .expect(myRedisDatabasePage.importDialogTitle.textContent).eql('Import Results', `Databases from ${fileParameters.type} not imported`);
    }

    /**
     * Parse json for importing databases
     * @param path The path to json file
     */
    parseDbJsonByPath(path: string): any[] {
        return JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
}

/**
 * Import database parameters
 * @param path The path to file
 * @param type The type of application
 * @param dbNames The names of databases
 * @param userName The username of db
 * @param password The password of db
 * @param connectionType The connection type of db
 * @param fileName The file name
 * @param parsedJson The parsed json content
 */
export type ImportDatabaseParameters = {
    path: string,
    type?: string,
    dbNames?: string[],
    userName?: string,
    password?: string,
    connectionType?: string,
    fileName?: string,
    parsedJson?: any
};
