var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var MessageSchema = new mongoose.Schema({
    to: String,
    from: String, 
    for: String, 
    gift: String,
    forID: String, 
    giftID: String, 
    text: String
});

mongoose.model('Message', MessageSchema);