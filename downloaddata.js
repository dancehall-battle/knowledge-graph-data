const GoogleSpreadsheet = require('google-spreadsheet');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs-extra');

if (process.argv.length !== 3) {
  console.error('Please provide the id of the Google Sheets.');
  process.exit(1);
}

const doc = new GoogleSpreadsheet(process.argv[2]);
const wantedSheetTitles = ['events', 'organizers', 'battles', 'battle_winner', 'people'];

// Make sure the directory 'files' exists.
fs.ensureDirSync('./files');

doc.getInfo((err, info) => {
  info.worksheets.forEach(sheet => {
    if (wantedSheetTitles.indexOf(sheet.title) !== -1) {
      downloadSheetAsCSV(sheet);
    }
  });
});

async function downloadSheetAsCSV(sheet) {
  return new Promise(async (resolve, reject) => {
    const header = await getHeaders(sheet);

    const csvWriter = createCsvWriter({
      path: `./files/${sheet.title}.csv`,
      header
    });

    sheet.getRows(async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        await csvWriter.writeRecords(rows);
        resolve();
      }
    });
  });
}

function getHeaders(sheet) {
  return new Promise((resolve, reject) => {
    sheet.getRows({offset: 0, limit: 1}, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const row = rows[0];
        resolve(Object.keys(row)
          .filter(key => (!key.startsWith('_') && key !== 'save' && key !== 'del' ))
          .map(header => { return {id: header, title: header}})
        );
      }
    });
  });
}