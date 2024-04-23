const {GoogleSpreadsheet} = require('google-spreadsheet');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs-extra');

main();

async function main() {
  if (process.argv.length !== 3) {
    console.error('Please provide path to config file.');
    process.exit(1);
  }

  const config = await fs.readJSON(process.argv[2]);

  const doc = new GoogleSpreadsheet(config.sheetId);
  doc.useApiKey(config.googleApiKey);
  await doc.loadInfo();
  const wantedSheetTitles = ['events', 'organizers', 'battles', 'battle_winner', 'people', 'battle_judge'];

  // Make sure the directory 'files' exists
  await fs.ensureDir('./files');

  doc.sheetsByIndex.forEach(sheet => {
    if (wantedSheetTitles.indexOf(sheet.title) !== -1) {
      downloadSheetAsCSV(sheet);
    }
  });
}

async function downloadSheetAsCSV(sheet) {
  const header = await getHeaders(sheet);

  const csvWriter = createCsvWriter({
    path: `./files/${sheet.title}.csv`,
    header
  });

  const rows = await sheet.getRows();
  await csvWriter.writeRecords(rows);
}

async function getHeaders(sheet) {
  const rows = await sheet.getRows({offset: 0, limit: 1});

  const row = rows[0];
  return Object.keys(row)
    .filter(key => (!key.startsWith('_') && key !== 'save' && key !== 'del' ))
    .map(header => { return {id: header, title: header}});
}
