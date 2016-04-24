const express = require('express');
const expressId = require('express-id');
const shortid = require('shortid');

const app = express();

app.get('/', expressId(() => shortid.generate() + '/1/'));

app.get('/:id/:rev/*', (req, res) => {
    res.sendFile(req.params[0] || 'index.html', { root: './ui' });
});

var server = app.listen(process.env.PORT || 5000, () => {
    console.log('Listening on ' + server.address().port);
});

