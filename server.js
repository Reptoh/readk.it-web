'use strict';

const express = require('express');
const fileUpload = require('express-fileupload');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

var fs = require('fs');
var dir = '/data/input/';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
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

  file.mv(dir + file.name, function(err) {
	if(err){
	  console.log(err);
	  res.sendStatus(500);

	} else {
	  console.log("uploaded");
	  res.sendStatus(200);
	}
  });
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);