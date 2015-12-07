var mongoose = require('mongoose');

var BookSchema = new mongoose.Schema({
    title: String,
    author: String,
    writer: String,
    description: String
});

mongoose.model('Book', BookSchema);