var credentials = require('./credentials.json');
var user = credentials.user;
var tableNames = [];
var tableDescriptions = [];
var specificTableDescriptions = [];
var databaseNames = [];
var databaseSizes = [];
var databaseCounter = 0;
var databaseTag = "---|";
var tableTag = "......|";
var tableIndex = 0;
var tableDescriptionLengths = [];


// Setting up packages and connection information
var mysql=require("mysql");
credentials.host="ids";
var connection = mysql.createConnection(credentials);
var async=require("async");


// Data collection is handled using async
async.series([
  function(callback) {

    connection.connect(function(err){
      if(err){
        console.log("Problems with MySQL: "+err);
      } else {
        console.log("Connected to Database.");
        console.log("Collecting Database Information...");
      }
    });

// Querying the users database for the names of their databases
    connection.query('SHOW DATABASES',function(err,rows,fields){
      if(err){
        console.log('Error looking up databases');
      } else {
        databaseNames = rows;
        for (var i = 0; i < rows.length; i++){
          databaseNames[i] = databaseNames[i].Database;
        }
    }
      callback();
    });
  },
  function(callback) {
    console.log("Collecting Table Information...")
  for (var i = 0; i < databaseNames.length; i++) {

    // Querying the database for the names of tables
    connection.query('SHOW TABLES from ' + databaseNames[i], function(err, rows, fields) {
      if (err) {
        console.log('Error looking up tables from ' + databaseNames[i]);
      } else {
        databaseCounter++;
        databaseSizes.push(rows.length);
        var databaseSelector = fields[0]['name'];
        for (var j = 0; j < rows.length; j++) {
          tableNames.push(rows[j][databaseSelector]);
        }
      }

     if (databaseCounter == databaseNames.length) {
       callback();
     }
    });
    }
  },
 function(callback) {
  console.log("Collecting Descriptions from Tables...")
    for (var i = 0; i < databaseNames.length; i++) {
      for (var j = 0; j < databaseSizes[i]; j++) {

        // Querying the database for the descriptions of tables
          connection.query('DESCRIBE ' + databaseNames[i] + '.' + tableNames[tableIndex], (function(tableDescriptions, tableDescriptionLengths, tableIndex) { return function(err, rows, fields) {
            if (err) {
              console.log("Error gathering descriptions: " + err);
            } else {
            specificTableDescriptions = rows;
           tableDescriptionLengths.push(specificTableDescriptions.length)
            for (var k = 0; k < specificTableDescriptions.length; k++) {
              tableDescriptions.push("          " + "FieldName:  " + "`" + specificTableDescriptions[k].Field + "`" + "      " + "(" + specificTableDescriptions[k].Type + ")");
          }
            if (tableIndex == tableNames.length - 1) {
              console.log("Finished with the database Connection.")
              connection.end()
              createSummary();
              callback();
            }
          }
          };
        })(tableDescriptions, tableDescriptionLengths, tableIndex));
          tableIndex++;
      }
    }


}
]);

// Creates a summary from the now populated arrays of data
function createSummary() {
  //local variables used for indexing
var tableLogIndex = 0;
var descriptionLogIndex = 0;

console.log("Generating database Summary.");

for (var i = 0; i < databaseNames.length; i++) {
  console.log(databaseTag + databaseNames[i]);

  for (var j = 0; j < databaseSizes[i]; j++) {
    console.log(tableTag + tableNames[tableLogIndex]);

    for (var k = 0; k < tableDescriptionLengths[tableLogIndex]; k++) {
      console.log(tableDescriptions[descriptionLogIndex]);
      descriptionLogIndex++;
    }
    tableLogIndex++
  }
}
console.log("All done now.");
}
