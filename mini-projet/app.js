var express = require('express'); // Modules utilisés
var storage = require('node-persist');
var validator = require('validator');
var bcrypt = require('bcryptjs');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

var app = express(); 
storage.initSync(); //Initialisation Synchrone du stockage

app.use(express.static('public')); // Dit à express où se trouve les fichiers statiques
app.use(express.json()); //Permet à express de parser les données clients
app.use(session({
  store: new FileStore(), //Module de stockage des cookies
  secret: 'AusecoursJesaisplusAQuoicasert', // Au secours
  cookie: { maxAge: 60 * 60 * 1000 }, //Durée du Cookie
  resave: false, //                                                             Courtes: Relire la doc pour completer le commentaire
  saveUninitialized: false
}));

app.get('/api', function (req, res) {           //GET la fonction de /api
  res.send('You\'re not looking for that.');
});

app.post('/api/createStudent', function (req, res) {  //Execute la creation du compte en POST
  try {    //Bloc d'execution
    if (req.body.name === undefined || req.body.password === undefined) { // Si c'est non défini
      throw new Error('bad request'); //Arrete l'execution et envoi en catch
    }
    var studentName = req.body.name;
    var password = req.body.password;
    if (!validator.isAlpha(studentName)) { // Verifie la valeur A -> Z
      throw new Error('Invalid student name (must be containing only letters)'); //Arrete l'execution et envoi en catch
    }
    if (!validator.isAlphanumeric(password)) { // Verifie la valeur A -> 9
      throw new Error('Invalid password (must be containing only letters and numbers)'); //Arrete l'execution et envoi en catch
    }
    if (storage.getItemSync(studentName) !== undefined) { // Verifie s'il existe deja
      throw new Error('Username already exists !'); //Arrete l'execution et envoi en catch
    }

    var salt = bcrypt.genSaltSync(10);  // Chiffrage du mot de passe
    var hash = bcrypt.hashSync(password, salt); 

    storage.setItemSync(studentName, { //Creer l'objet Etudiant
      grades: [],
      hasEvalued: [],
      passHash: hash,
      evaluating: ''
    });
    res.json({ //Envoie de reponse json
      username: studentName
    });
  }
  catch (e) {
    console.log(e);
    res.status(400).json({
      error: e.message,
    });
  }
});

app.post('/api/connect', function (req, res) {  //Fonction de connexion
  try {
    if (req.body.name === undefined || req.body.password === undefined) {
      throw new Error('bad request');
    }
    var studentName = req.body.name;
    var password = req.body.password;
    if (!validator.isAlpha(studentName)) {
      throw new Error('Invalid student name (must be containing only letters)');
    }
    if (!validator.isAlphanumeric(password)) {
      throw new Error('Invalid password (must be containing only letters and numbers)');
    }
    if (storage.getItemSync(studentName) === undefined) { //si le nom n'existe pas
      throw new Error('Wrong username.');
    }

    var hash = storage.getItemSync(studentName).passHash;  //récupère le hash du mot de passe

    if (!bcrypt.compareSync(password, hash)) { //compare les hash
      throw new Error('Wrong password.');
    }

    req.session.username = studentName; // Donne a la session l'username de studentName

    res.json({
      username: studentName
    });
  }
  catch (e) {
    console.log(e);
    res.status(400).json({
      error: e.message,
    });
  }
});

app.get('/api/getStudent', function (req, res) { // Fonction d'etudiant aleatoire
  try {
    if (req.session.username === undefined) {
      throw new Error('You are not connected !');
    }

    var studentObject = storage.getItemSync(req.session.username);

    if (studentObject.hasEvalued.length >= 3) { //pas plus de 3 notations
      throw new Error('You have reached your maximum evaluations.')
    }
    if (studentObject.evaluating !== '' && studentObject.evaluating !== undefined) {
      try {
        res.json({
          randomStudent: studentObject.evaluating
        });
      }
      catch (e) {
        console.log(e);
      }
    }
    else {
      var students = [];

      storage.forEach(function (studentName) {
        var student = storage.getItemSync(studentName);
        if (student.grades.length < 3) {
          students.push(studentName);
        }
      });

      var selfIndex = students.indexOf(req.session.username);
      students.splice(selfIndex, 1);

      for (let name of studentObject.hasEvalued) {
        var removeIndex = students.indexOf(name);
        students.splice(removeIndex, 1);
      }

      var randomStudent = students[Math.floor(Math.random() * students.length)];

      studentObject.evaluating = randomStudent;
      storage.setItemSync(req.session.username, studentObject);

      res.json({
        randomStudent: randomStudent
      });
    }
  }
  catch (e) {
    console.log(e);
    res.status(400).json({
      error: e.message,
    });
  }
});

app.post('/api/evaluateStudent', function (req, res) { //Fonction qui attribue la note à un etudiant
  try {
    if (req.session.username === undefined) {
      throw new Error('You are not connected !');
    }

    var connectedStudent = storage.getItemSync(req.session.username);

    if (connectedStudent.evaluating === '') {
      throw new Error('You must generate a student to evaluate first !');
    }

    var grade = req.body.grade;

    if (!validator.isNumeric(grade) || grade < 0 || grade > 20) {
      throw new Error('You must provide a correct grade !');
    }

    var evaluedStudent = storage.getItemSync(connectedStudent.evaluating);

    if (evaluedStudent.grades.length >= 3) {
      connectedStudent.evaluating = '';
      throw new Error('This student has reached max grades. Try again.');
    }

    evaluedStudent.grades.push(grade);
    storage.setItemSync(connectedStudent.evaluating, evaluedStudent);

    connectedStudent.hasEvalued.push(connectedStudent.evaluating);
    connectedStudent.evaluating = '';
    storage.setItemSync(req.session.username, connectedStudent);

    res.json({

    });
  }
  catch (e) {
    console.log(e);
    res.status(400).json({
      error: e.message,
    });
  }
});

app.get('/api/getAllStudents', function (req, res) { //Fonction recupere les notes en enlevant les mots de passes
  try {
    if (req.session.username === undefined) {
      throw new Error('You are not connected !');
    }

    var connectedStudent = storage.getItemSync(req.session.username);

    if (connectedStudent.hasEvalued.length < 3) {
      throw new Error('You must evaluate 3 students first.');
    }

    var students = [];

    storage.forEach(function (studentName) {
      var student = storage.getItemSync(studentName);
      student.passHash = 'Nice Try.';
      students.push({name: studentName, data: student});
    });

    res.json({
      students: students
    });
  }
  catch (e) {
    console.log(e);
    res.status(400).json({
      error: e.message,
    });
  }
})

app.get('/api/disconnect', function (req, res) { //Fin de session
  req.session.destroy();

  res.send();
});

app.listen(3000); //Le bon vieux port 3000
