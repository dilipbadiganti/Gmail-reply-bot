
//imported required modules
const path = require('path')
const express = require('express');
const gmailController = require('./controllers/gmailController');
const googleAuth = require('./utils/googleAuth');
const gmailService = require('./services/gmailService');

//path for labels.html


// Creating express App
const app = express();
const port = 7004;

app.get('/', async (req, res) => {
  //creating auth instance
  const auth = await googleAuth.googlAuthenticate();
  const response = await gmailService.getLabels(auth);
  gmailController.main(auth).catch(err => console.log(err));

  const labels = response.data.labels;
  // res.send("Authentication success!");
  res.sendFile(path.join(__dirname, '../', 'VacationGmailAutoResponseApp', 'label.html'))
});
app.listen(port, () => {
  console.log(`App listening on port: ${port}`);
});
