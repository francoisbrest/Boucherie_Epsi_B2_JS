var app = new Vue({  //Initialisation de l'objet VueJS
  el: '#app',
  data: {
    appTitle: 'Mini Projet Sujet 2: Notation de Groupe',
    username: '',
    password: '',
    connectUsername: '',
    connectPassword: '',
    informations: 'Informations',
    connected: false,
    toEvaluate: '',
    grade: '',
    students: []
  },
  methods: {
    createUser: function () {
      var self = this;

      $.ajax('api/createStudent', { // $ = jquery
        data: JSON.stringify({name: self.username, password: self.password}), //donnees envoyees au serveur
        contentType: 'application/json', 
        type: 'POST',
        dataType: 'json' //type de donnee renvoyees par le serveur
      })
      .done(function (data) { //reussi
        self.informations = 'User successfully created: ' + data.username;
      })
      .fail(function (data) { //echoue
        self.informations = 'Error: ' + data.responseJSON.error;
      });
    },

    connect: function () {
      var self = this;

      $.ajax('api/connect', {
        data: JSON.stringify({name: self.connectUsername, password: self.connectPassword}),
        contentType: 'application/json',
        type: 'POST',
        dataType: 'json'
      })
      .done(function (data) {
        self.informations = data.username + ' connected.';
        self.connected = true;
        self.getStudent();
      })
      .fail(function (data) {
        self.informations = 'Error: ' + data.responseJSON.error;
      });
    },

    getStudent: function () {
      var self = this;

      $.ajax('api/getStudent', {
        type: 'GET',
        dataType: 'json'
      })
      .done(function (data) {
        self.toEvaluate = data.randomStudent;
      })
      .fail(function (data) {
        self.informations = 'Error: ' + data.responseJSON.error;
      });
    },

    evaluate: function () {
      var self = this;

      $.ajax('api/evaluateStudent', {
        data: JSON.stringify({grade: self.grade}),
        contentType: 'application/json',
        type: 'POST',
        dataType: 'json'
      })
      .done(function (data) {
        self.informations = 'Grade successfully memorized !';
        self.getStudent();
      })
      .fail(function (data) {
        self.informations = 'Error: ' + data.responseJSON.error;
      });
    },

    disconnect: function () {
      var self = this;

      $.ajax('api/disconnect', {
        type: 'GET',
      })
      .done(function (data) {
        self.informations = 'Disconnected.';
        self.connected = false;
      })
    },

    getResults: function () {
      var self = this;

      $.ajax('api/getAllStudents', {
        type: 'GET',
        dataType: 'json'
      })
      .done(function (data) {
        self.students = data.students;
      })
      .fail(function (data) {
        self.informations = 'Error: ' + data.responseJSON.error;
      });
    },

    moyenne: function () {
      var i;
      this.getResults();

      console.log(this.students);
    }
  }
});


