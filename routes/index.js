var express = require('express');
var jwt = require('express-jwt');
var router = express.Router();
var auth = jwt({secret: 'SECRET', userProperty: 'payload'})

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var passport = require('passport');
var Book = mongoose.model('Book');
var User = mongoose.model('User');
var Message = mongoose.model('Message');

router.post('/register', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password);
    
    user.save(function (err){
        if(err){ return next(err); }

        return res.json({token: user.generateJWT()})
    });
});

router.post('/login', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }
    
    passport.authenticate('local', function(err, user, info){
        if(err){ return next(err); }
    
        if(user){
            return res.json({token: user.generateJWT()});
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

router.get('/books', function (req, res, next) {
    Book.find(function (err, books) {
        if (err) { next(err) }
        
        res.json(books);
    });
});

router.get('/messages/:author', function (req, res, next) {
    Message.find({to: req.params.author}, function (err, response) {
        if (err) { next(err) }
        res.json(response);
    });
});

router.get('/books/author/:username', function (req, res, next) {
    var username = req.params.username;
    Book.find({author: username}, function (err, books) {
        if (err) { next(err) }
        
        res.json(books);
    });
});

router.post('/books', auth, function (req, res, next) {
    var book = new Book(req.body);
    book.author = req.payload.username;
    
    book.save(function (err, book) {
        console.log(err);
        if (err) { return next(err) }
        
        res.json(book);
    });
});

router.get('/books/get', function(req, res) {
    console.log(req.body);
})

router.post('/newMessage', auth, function (req, res, next) {
    console.log(req.body);
    var message = new Message(req.body);
    
    console.log(message);
    message.save();
    
    User.findOne({username: req.body.to}, function (err, result) {
        result.sendMessage(message);
        res.json("message sent");
    })
});

router.param('book', function(req, res, next, id) {
  var query = Book.findById(id);

  query.exec(function (err, book){
    if (err) { return next(err); }
    if (!book) { return next(new Error('can\'t find book')); }

    req.book = book;
    return next();
  });
});

router.get('/books/:book', function(req, res) {
    res.json(req.book);
});

router.put('/books/:book/:vote', auth, function(req, res, next) {
    var vote = req.params.vote;
    req.book.upvote(vote, function(err, book) {
        if(err) { return next(err); }
        
        res.json(book);
    });
});

router.delete('/books/:book', function(req, res, next) {
    req.book.remove(function(err, book){
        if (err) { return next(err); }

        res.json(book);
    });
});

router.delete('/trades/:id', function(req, res, next) {
    Message.remove({_id: req.params.id}, function(err, result) {
        
        
        res.json("removed");
    });
    
});

router.delete('/book/trades/:bookName', function(req, res, next) {
    Message.remove({for: req.params.bookName}, function (err, results) {
        res.json("removed");
    })
});

router.put('/books/trade', function(req, res, next) {
    Book.findOne({_id: req.body.giftID}, function(err, result) {
        result.author = req.body.to;
        result.save();
    })
    Book.findOne({_id: req.body.forID}, function(err, result) {
        result.author = req.body.from;
        result.save();
    })
    
    res.json("swapped")
});

router.post('/profile/update/:user', function(req, res, next) {
    
    User.findOne({username: req.params.user}, function(err, response) {
        
        response.fullname = req.body.fullname;
        response.city = req.body.city;
        response.state = req.body.state;
        
        response.save();
        
        res.json({
            fullname: req.body.fullname,
            city: req.body.city,
            state: req.body.state
        });
        
    })
});

router.get('/profile/info', auth, function(req, res, next) {
    
    User.findOne({username: req.payload.username}, function(err, response) {
        
        res.json({
            fullname: response.fullname,
            city: response.city,
            state: response.state
        });
        
    })
});

module.exports = router;
