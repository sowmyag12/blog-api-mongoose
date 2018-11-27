'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const authorSchema = mongoose.Schema({
    firstName: 'string',
    lastName: 'string',
    userName: {
      type: 'string',
      unique: true
    }
  });

const commentSchema = mongoose.Schema({ content: 'string' });

const blogPostSchema = mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
    title: {type: String, required: true},
    content: {type: String, required: true},
    created: {type: Date, default: Date.now},
    comments: [commentSchema]
});

blogPostSchema.pre('find', function(next) {
    this.populate('author');
    next();
});
  
blogPostSchema.pre('findOne', function(next) {
    this.populate('author');
    next();
});

/*blogPostSchema.post('create', function(next) {
    this.populate('author');
    next();
});*/

blogPostSchema.virtual('authorName').get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

/*authorSchema.virtual('authorName').get(function() {
    return `${this.firstName} ${this.lastName}`.trim();
});*/

blogPostSchema.methods.serialize = function() {
    return {
        id: this._id,
        author: this.authorName,
        content: this.content,
        title: this.title,
        created: this.created,
        comments: this.comments
    };
};


authorSchema.methods.serialize = function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        userName: this.userName
    }
}
const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = {Author, BlogPost};