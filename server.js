'use strict';

const express = require("express");
const morgan = require('morgan');
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { Author, BlogPost } = require("./model");

const app = express();

app.use(morgan('common'));
app.use(express.json());

// Authors GET, POST, PUT, DELETE
app.get('/authors', (req,res) => {
    Author
    .find()
    .then(authors => {
        res.json(authors.map(author => author.serialize()));
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'});
    });
});

app.post('/authors', (req, res) => {
    const requiredFields = ['firstName', 'lastName', 'userName'];
    requiredFields.forEach(field => {
      if (!(field in req.body)) {
        const message = `Missing \`${field}\` in request body`;
        console.error(message);
        return res.status(400).send(message);
      }
    });

    Author
    .findOne({userName: req.body.userName})
    .then(author => {
        if(author) {
            const message = `${req.body.userName} already taken`;
            console.error(message);
            return res.status(400).send(message);
        }
        else {
            Author
            .create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                userName: req.body.userName
            })
            .then(author => res.status(201).json(author.serialize()))
            .catch(err => {
                console.error(err);
                res.status(500).json({error: 'something went wrong'});
            });
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'});
    });
});

app.put('/authors/:id', (req,res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({
            error: 'IDs should match'
        });
    }

    const updated = {};
    const updateableFields = ['firstName', 'lastName', 'userName'];
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    });

    Author
    .findOne({userName: req.body.userName || '', _id:{ $ne: req.params.id } })
    .then(author => {
        if(author) {
            const message = `${req.body.userName} already taken`;
            console.error(message);
            return res.status(400).send(message);
        }
        else {
            Author
            .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
            .then(updatedAuthor => {
                res.status(200).json(updatedAuthor.serialize());
            })
            .catch(err => res.status(500).json({ message: err }));
        }
    });
});

app.delete('/authors/:id', (req, res) => {
    BlogPost
    .remove({ author: req.params.id })
    .then(() => {
        Author
        .findByIdAndRemove(req.params.id)
        .then(() => {
            console.log(`Deleted blog posts owned by and author with id \`${req.params.id}\``);
            res.status(204).json({ message: 'success' });
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'something went terribly wrong' });
    });
});


// Blogposts GET, POST, PUT, DELETE
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
    const fields = ['title', 'author_id', 'content'];
    fields.forEach(field => {
        if(!(field in req.body)) {
            res.status(400).json({error: `${field} is missing`});
        }
    });

    Author
    .findById(req.body.author_id)
    .then(author => {
        if (author) {
            BlogPost
            .create({
                title: req.body.title,
                content: req.body.content,
                author: req.body.author_id
            })
            .then(post => {
               return BlogPost.findById(post._id);
            })
            .then(blogPost => res.status(201).json(blogPost.serialize()))
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Something went wrong' });
            });
        }
        else {
            const message = `Author not found`;
            console.error(message);
            return res.status(400).send(message);
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'something went horribly awry' });
    });
});

app.put('/posts/:id', (req,res) => {
    if(!(req.params.id === req.body.id && req.params.id && req.body.id)) {
        res.status(400).json({error: 'Ids must match' });
    }

    const updated = {};
    const updateableFields = ['title', 'content'];
    updateableFields.forEach(field => {
        if (field in req.body) {
        updated[field] = req.body[field];
        }
    });
    BlogPost
    .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
    .then(post => {
        return BlogPost.findById(post._id);
     })
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
            res.status(204).json({message: 'success'});
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