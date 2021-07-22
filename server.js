'use strict';

const express = require('express');
const fileUpload = require('express-fileupload');
const { spawn } = require('child_process');
const path = require('path');
const fs=require('fs');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

var inputDir = 'data/input/';
var outputDir = 'data/output/';

if (!fs.existsSync(inputDir)){
    fs.mkdirSync(inputDir, {recursive: true});
}

// App
const app = express();

app.use(fileUpload());
app.use(express.static(process.cwd()+"/readkit-web/dist/readkit-web/"));

app.get('/', (req,res) => {
  res.sendFile(process.cwd()+"/readkit-web/dist/readkit-web/index.html")
});

app.route('/api/upload').post(onFileupload);

function onFileupload(req, res) {

  let file = req['files'].thumbnail;

  console.log("File uploaded: ", file.name);

  file.mv(inputDir + file.name, function(err) {
	if(err){
	  console.log(err);
	  res.sendStatus(500);

	} else {
	  console.log("uploaded");
	  var child = spawn('grunt', ['default'], { shell: true });
	  child.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`);
		});
		  
		child.stderr.on('data', (data) => {
		  console.error(`stderr: ${data}`);
		});
		  
		child.on('close', (code) => {
		  console.log(`child process exited with code ${code}`);
		  if(code === 0) {
		  	fs.readdir(outputDir, function (err, files) {
					    //handling error
					    if (err) {
					        return console.log('Unable to scan directory: ' + err);
					    }
					    var stat = fs.statSync(outputDir + files[0]);
					    console.log('result path  ' + outputDir + files[0]);
					    res.writeHead(200, {
					        'Content-Type': 'application/zip',
					        'Content-Length': stat.size,
					        'Content-disposition': 'attachment; filename=' + files[0]
					    });

							var readStream = fs.createReadStream(outputDir + files[0]);
							    // We replaced all the event handlers with a simple call to readStream.pipe()
					    readStream.pipe(res);

					    //res.end();
					    //res.send(files[0]);
					    //res.download(outputDir + files[0]);
					    //res.send({ filename: files[0]});
					});
			  }
		});
	}
  });
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);