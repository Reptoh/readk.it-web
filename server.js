'use strict';

const express = require('express');
const fileUpload = require('express-fileupload');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const epubParser = require('epub-metadata-parser');

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

app.get('/*', (req,res) => {
  res.sendFile(process.cwd()+"/readkit-web/dist/readkit-web/index.html")
});

app.route('/api/upload').post(onFileupload);

app.route('/api/convert').post(convert);

function convert(req, res) {
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
	  				var file = null;

	  				for(var i=0;i<files.length;i++){
				        var filename=path.join(outputDir,files[i]);
				        var stat = fs.lstatSync(filename);
				        if (filename.indexOf('zip')>=0) {
				            console.log('-- found: ',filename);
				            file = files[i];
				        };
				    };
				    //handling error
				    if (err && !file) {
				        return console.log('Unable to scan directory: ' + err);
				    }
				    

				    var stat = fs.statSync(outputDir + file);
				    console.log('result path  ' + file);
				    res.writeHead(200, {
				        'Content-Type': 'application/zip',
				        'Content-Length': stat.size,
				        'Content-disposition': 'attachment; filename=' + file
				    });

						var readStream = fs.createReadStream(outputDir + file);
						readStream.pipe(res);
				});
		  }
	});
}

function onFileupload(req, res) {

  let file = req['files'].thumbnail;

  console.log("File uploaded: ", file.name);

  file.mv(inputDir + file.name, function(err) {
	if(err){
	  console.log(err);
	  res.sendStatus(500);

	} else {
	  	var child = spawn('grunt', ['unzip'], { shell: true });
	  	child.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`);
		});
		  
		child.stderr.on('data', (data) => {
		  console.error(`stderr: ${data}`);
		});
		  
		child.on('close', (code) => {
		  console.log(`child process exited with code ${code}`);
		  if(code === 0) {
		  	epubParser.parse(inputDir + file.name, '/readkit.epub/' , book => {
			    console.log(book);
			    res.setHeader('Content-Type', 'application/json');
			    res.end(JSON.stringify(book));
			});
		  }
		});
	}
  });
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);