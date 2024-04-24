const {GoogleSpreadsheet} = require('google-spreadsheet');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs-extra');

main();

async function main() {
  if (process.argv.length !== 3) {
    console.error('Please provide the path to a config file.');
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
      let rowUpdate;

      if (sheet.title === 'battles') {
        rowUpdate = (row) => {
          if (!row.age) {
            row.age = 'all'
          }

          if (!row.gender) {
            row.gender = 'all'
          }

          if (!row.inviteonly) {
            row.inviteonly = 'no'
          }

          if (!row.customlabel) {
            row.customlabel = '(null)'
          }
        };
      }

      if (sheet.title === 'events') {
        rowUpdate = (row) => {
          if (!row.instagram) {
            row.instagram = '(null)'
          }

          if (!row.city) {
            row.city = '(null)'
          }
        };
      }

      if (sheet.title === 'people') {
        rowUpdate = (row) => {
          if (!row.instagram) {
            row.instagram = '(null)'
          }

          if (!row.country) {
            row.country = '(null)'
          }
        };
      }

      downloadSheetAsCSV(sheet, rowUpdate);
    }
  });
}

async function downloadSheetAsCSV(sheet, rowUpdate) {
  const header = await getHeaders(sheet);

  const csvWriter = createCsvWriter({
    path: `./files/${sheet.title}.csv`,
    header
  });

  const rows = await sheet.getRows();

  if (rowUpdate) {
    rows.forEach(row => {
      rowUpdate(row);
    });
  }

  await csvWriter.writeRecords(rows);
}

async function getHeaders(sheet) {
  const rows = await sheet.getRows({offset: 0, limit: 1});

  const row = rows[0];
  return Object.keys(row)
    .filter(key => (!key.startsWith('_') && key !== 'save' && key !== 'del' ))
    .map(header => { return {id: header, title: header}});
}
