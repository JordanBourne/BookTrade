var app = angular.module('display', ['ui.router']);
    
app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html'
            })
        
            .state('books', {
                url: '/books',
                templateUrl: '/books.html',
                controller: 'bookListCtrl',
                resolve: {
                    postPromise: ['books', function (books) {
                        return books.getAll();
                    }]
                }
            })
        
            .state('thebook', {
                url: '/books/{id}',
                templateUrl: '/theBook.html',
                controller: 'theBookCtrl',
                resolve: {
                    book: ['$stateParams', 'books', function ($stateParams, books) {
                        return books.get($stateParams.id);
                    }]
                }
            })
        
            .state('bookResults', {
                url: '/books/{id}/results',
                templateUrl: '/results.html',
                controller: 'resultsCtrl',
                resolve: {
                    book: ['$stateParams', 'books', function ($stateParams, books) {
                        return books.get($stateParams.id);
                    }]
                }
            })
        
            .state('newbook', {
                url: '/newbook',
                templateUrl: '/newbook.html',
                controller: 'NewBookCtrl'
            })
        
            .state('newMessage', {
                url: '/message/{id}',
                templateUrl: '/message.html',
                controller: 'MessageCtrl',
                resolve: {
                    book: ['$stateParams', 'books', function ($stateParams, books) {
                        return books.get($stateParams.id);
                    }],
                    postPromise: ['books', 'auth', function (books, auth) {
                        return books.getSome(auth.currentUser());
                    }]
                }
            })
        
            .state('messageSent', {
                url: '/messageSent/',
                templateUrl: '/messageSent.html'
            })
        
            .state('login', {
                url: '/login',
                templateUrl: '/logIn.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            })
            
        
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            })
        
            .state('profile', {
                url: '/profile',
                templateUrl: '/profile.html',
                controller: 'ProfileCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if (!auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }],
                resolve: {
                    postPromise: ['books', 'auth', function (books, auth) {
                        return books.getSome(auth.currentUser());
                    }],
                    messages: ['books', 'auth', function (books, auth) {
                        return books.getMessages(auth.currentUser());
                    }]
                }
            })
        
            .state('profileMessages', {
                url: '/profile/messages',
                templateUrl: '/messages.html',
                controller: 'MsgCenterCtrl',
                onEnter: ['$state', 'auth', function($state, auth) {
                    if (!auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }],
                resolve: {
                    messages: ['books', 'auth', function (books, auth) {
                        return books.getMessages(auth.currentUser());
                    }]
                }
            })
        
            .state('aboutYou', {
                url: '/profile/about',
                templateUrl: '/aboutYou.html',
                controller: 'AboutCtrl',
                resolve: {
                    userInfo: ['auth', function (auth) {
                        return auth.getLoc();
                    }]
                }
            })
        
        $urlRouterProvider.otherwise('home');
    }
]);

app.factory('auth', ['$http', '$window', function($http, $window) {
    var auth = {
        locationInfo: []
    };
    
    auth.saveToken = function(token) {
        $window.localStorage['vote-token'] = token;
    };
    
    auth.getToken = function() {
        return $window.localStorage['vote-token'];
    };
    
    auth.isLoggedIn = function() {
        var token = auth.getToken();
        
        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            
            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };
    
    auth.currentUser = function() {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            
            return payload.username;
        }
    };
    
    auth.register = function(user) {
        return $http.post('/register', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };
    
    auth.logIn = function(user) {
        return $http.post('/login', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };
    
    auth.logOut = function() {
        $window.localStorage.removeItem('vote-token');
    };
    
    auth.saveInfo = function(info) {
        return $http.post('/profile/update/' + info.user, info, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            angular.copy(data, auth.locationInfo);
        })
    }
    
    auth.getLoc = function() {
        return $http.get('/profile/info', {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            angular.copy(data, auth.locationInfo);
        })
    }
    
    return auth;
}])

app.factory('books', ['$http', 'auth', function ($http, auth) {
    var o = {
        books: []
    };
    
    
    o.getAll = function () {
        return $http.get('/books').success(function (data) {
            angular.copy(data, o.books);
        });
    };   
    
    o.getSome = function (username) {
        return $http.get('/books/author/' + username).success(function (data) {
            angular.copy(data, o.books);
        });
    };
    
    o.getBooks = function (bookList) {
        return $http.get('/books/get', bookList).success(function (data) {
            return data;
        });
    };
    
    o.getMessages = function(username) {
        return $http.get('/messages/' + username).success(function (data) {
            return data;
        })
    }
    
    o.create = function (book) {
        return $http.post('/books', book, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function (data) {
            o.books.push(data);
            
            window.location.href = "#/books/" + data._id;
        });
    };
    
    o.sendMessage = function (message) {
        return $http.post('/newMessage', message, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function (data) {
            window.location.href = "#/messageSent/";
        });
    };
    
    o.get = function (id) {
        return $http.get('/books/' + id).then(function (res) {
            return res.data;
        });
    };
    
    o.voteFor = function(book, val) {
        return $http.put('/books/' + book._id + '/' + val, null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data){
            book.answers[val].votes += 1;
            window.location.href = "#/books/" + book._id + "/results";
        });
    };
    
    o.delete = function(book) {
        return $http.delete('/books/' + book._id, null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        })
    };
    
    o.deleteMessage = function(msg) {
        return $http.delete('/trades/' + msg._id, null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        })
    };
    
    o.deleteMessages = function(msg) {
        return $http.delete('/book/trades/' + msg, null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        })
    };
    
    o.tradeBooks = function(info) {
        return $http.put('/books/trade', info)
    }
    
    return o;
}]);

app.controller('NewBookCtrl', [
    '$scope',
    'books',
    'auth',
    function ($scope, books, auth) {
        $scope.books = books.books;
        
        $scope.addBook = function () {
            if (!$scope.title || $scope.title === '') {
                $scope.error = "You must include the book title.";
                return;
            }
            
            if(!auth.isLoggedIn()) {
                $scope.error = 'You must be logged in!';
                return;
            }
            
            books.create({
                title: $scope.title,
                writer: $scope.writer,
                description: $scope.description
            });
                
            $scope.error = '';
        };
    }
]);

app.controller('bookListCtrl', [
    '$scope',
    'books',
    function ($scope, books) {
        $scope.books = books.books;
    }
]);

app.controller('theBookCtrl', [
    '$scope',
    'books',
    'book',
    'auth',
    function ($scope, books, book, auth) {
        $scope.book = book;
        $scope.error = '';
        
        if(book.author == auth.currentUser()) {
            $scope.doYouOwn = 1;
        } else {
            $scope.doYouOwn = 0;
        }
        
        $scope.msgOwner = function() {
            if(!auth.isLoggedIn()) {
                $scope.error = 'You must be logged in!';
                return;
            }
            
            
            window.location.href = "#/message/" + book._id;
            
            $scope.error = '';
        }
        
    }
]);

app.controller('resultsCtrl', [
    '$scope',
    'books',
    'book',
    function ($scope, books, book) {
        $scope.book = book;
        $scope.answers = book.answers;
        $scope.chartLabels = [];
        $scope.chartData = [];
        for(var i = 0; i < book.answers.length; i++) {
            $scope.chartLabels.push(book.answers[i].option);
            $scope.chartData.push(book.answers[i].votes);
        }
    }
]);

app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function($scope, $state, auth){
        $scope.user = {};

        $scope.register = function(){
            auth.register($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };

        $scope.logIn = function(){
            auth.logIn($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };
}])

app.controller('ProfileCtrl', [
    '$scope',
    'books',
    'auth',
    'messages',
    function($scope, books, auth, messages){
        $scope.currentUser = auth.currentUser();
        $scope.books = books.books;
        $scope.messages = messages.data;
        
        $scope.delete = function (book) {
            books.delete(book);
            $scope.books.splice($scope.books.indexOf(book),1);
        }
        
        $scope.tab = 1;
        
        $scope.setTab = function(num) {
            this.tab = num;
        }
        
        $scope.isTab = function(num) {
            return this.tab === num;
        }
        
        $scope.acceptTrade = function (num) {
            books.tradeBooks(messages.data[num]);
            books.deleteMessages(messages.data[num].for);
            $scope.messages.splice(num, 1);
            window.location.href = '#/profile';
        }
        
        $scope.declineTrade = function(num) {
            books.deleteMessage(messages.data[num]);
            $scope.messages.splice(num, 1);
        };
    }
]);

app.controller('MsgCenterCtrl', [
    '$scope',
    'books',
    'auth',
    'messages',
    function($scope, books, auth, messages){
        $scope.currentUser = auth.currentUser();
        $scope.messages = messages.data;
        
        $scope.setTab = function(num) {
            this.tab = num;
        }
        
        $scope.isTab = function(num) {
            return this.tab === num;
        }
        
        $scope.acceptTrade = function (num) {
            books.tradeBooks(messages.data[num]);
            books.deleteMessages(messages.data[num].for);
            $scope.messages.splice(num, 1);
            window.location.href = '#/profile';
        }
        
        $scope.declineTrade = function(num) {
            books.deleteMessage(messages.data[num]);
            $scope.messages.splice(num, 1);
        };
    }
]);

app.controller('NavCtrl', [
    '$scope',
    'auth',
    function($scope, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }
]);

app.controller('AboutCtrl', [
    '$scope',
    'auth',
    function($scope, auth){
        $scope.currentUser = auth.currentUser;
        $scope.displayInfo = auth.locationInfo;
        
        
        
        $scope.saveInfo = function() {
            auth.saveInfo({
                fullname: $scope.fullname,
                city: $scope.city,
                state: $scope.state,
                user: $scope.currentUser()
            })
            $scope.abtInput = 0;
        }
        
        $scope.abtInput = 0;
        
        $scope.editInfo = function (num) {
            return $scope.abtInput == num;
        }
        
        $scope.changeInfo = function () {
            $scope.abtInput = 1;
        }
        
        $scope.cancelEdit = function () {
            $scope.abtInput = 0;
        }
    }
]);

app.controller('MessageCtrl', [
    '$scope',
    'books',
    'book',
    'auth',
    function($scope, books, book, auth) {
        $scope.books = books.books;
        $scope.book = book;
        
        $scope.msgOwner = function() { 
            books.sendMessage({
                to: book.author, 
                from: auth.currentUser(),
                for: book.title,
                forID: book._id,
                gift: $scope.books[$scope.gift].title,
                giftID: $scope.books[$scope.gift]._id,
                text: $scope.messageText
            })
        }
    }
]);