'use strict';

const express = require("express");
const morgan = require('morgan');
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { BlogPost } = require("./model");

const app = express();
app.use(express.json());

app.get('/posts', (req,res) => {
    BlogPost
    .find()
    .then(posts => {
        res.json(posts.map(post => post.serialize()));
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'});
    });
});

app.get('/posts/:id', (req,res) => {
    if (!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        res.status(400).json({message: 'id is not valid'});
    }
    BlogPost
    .findById(req.params.id)
    .then(post => res.json(post.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'});
    });
});

app.post('/posts', (req,res) => {
    const fields = ['title', 'author', 'content'];
    fields.forEach(field => {
        if(!(field in req.body)) {
            res.status(400).json({error: `${field} is missing`});
        }
    });
    BlogPost.create({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        created: req.body.created
    })
    .then(post => res.status(201).json(post.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'});
    });
});

app.put('/posts/:id', (req,res) => {
    const fields = ['title', 'author', 'content', 'id'];
   /* fields.forEach(field => {
        if(!(field in req.body)) {
            res.status(400).json({error: `${field} is missing`});
        }
    });*/
    if(!(req.params.id === req.body.id && req.params.id && req.body.id)) {
        res.status(400).json({error: 'Ids must match' });
    }

    const updated = {};
    const updateableFields = ['title', 'content', 'author'];
    updateableFields.forEach(field => {
        if (field in req.body) {
        updated[field] = req.body[field];
        }
    });
    BlogPost
    .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
    .then(post =>{
        if(post) {
            res.status(200).json(post.serialize());
        }
        else {
            res.status(404).json({message: 'id not found'});
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'});
    });
});

app.delete('/posts/:id', (req,res) => {
    if (!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        res.status(400).json({message: 'id is not valid'});
    }
    BlogPost
    .findByIdAndRemove(req.params.id)
    .then(post => {
        if(post) {
            res.status(204).json({message: `success`});
        }
        else {
            res.status(400).json({message:'id not found'});
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'});
    });
});

app.use('*', (req,res) => {
    res.status(404).json({message: 'Url Not Found'});
});

let server;

function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, { useNewUrlParser: true }, err => {
            if(err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening in ${port}`);
                resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('closing server');
            server.close(err => {
                if(err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }); 
}

if(require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { runServer, app, closeServer };