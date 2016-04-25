'use strict';

const express = require('express');
const expressId = require('express-id');
const shortid = require('shortid');
const MongoClient = require('mongodb').MongoClient;

const whenConnectedToDb = new Promise((resolve, reject) => {
  MongoClient.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/soilbox', (err, db) => {
    if (err) {
      reject(err);
    } else {
      console.log('Connected to DB');
      resolve(db);
    }

    //db.close();
  });
});

const app = express();

app.get('/', expressId(() => shortid.generate() + '/1/'));

app.get('/:id/:rev/*', (req, res, next) => {
  whenConnectedToDb
    .then(db => {
      return db.collection('levels').findOne({ id: req.params.id, rev: req.params.rev });
    })
    .then(level => {
      console.log('level', level);

      res.sendFile(req.params[0] || 'index.html', { root: './ui' });

    })
    .catch(next);
});

let server = app.listen(process.env.PORT || 5000, () => {
  console.log('Listening on ' + server.address().port);
});
