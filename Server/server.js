const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Read data from file, or initialize to empty array if file does not exist
try {
  ADMINS = JSON.parse(fs.readFileSync('admins.json', 'utf8'));
  USERS = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  COURSES = JSON.parse(fs.readFileSync('courses.json', 'utf8'));
} catch {
  ADMINS = [];
  USERS = [];
  COURSES = [];
}

const ADMINSECRET = 'admin-secret-key';
const USERSECRET = 'user-secret-key';

const authenticateAdminJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const adminToken = authHeader.split(' ')[1];
    jwt.verify(adminToken, ADMINSECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
const authenticateUserJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const userToken = authHeader.split(' ')[1];
    jwt.verify(userToken, USERSECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
app.get("/admin/me", authenticateAdminJwt, (req, res) => {
  res.json({
    username: req.user.username
  })
})
app.get("/user/me", authenticateUserJwt, (req, res) => {
  res.json({
    username: req.user.username
  })
})
// Admin routes
app.post('/admin/signup', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const secretKEY = req.body.secretKEY;
  if(secretKEY==='adminKEY'){
    const admin = ADMINS.find(a => a.username === username);
    console.log("admin signup");
    if (admin) {
      res.status(403).json({ message: 'Admin already exists' });
    } else {
      const newAdmin = { username, password };
      ADMINS.push(newAdmin);
      fs.writeFileSync('admins.json', JSON.stringify(ADMINS));
      const token = jwt.sign({ username, role: 'admin' }, ADMINSECRET, { expiresIn: '1h' });
      res.json({ message: 'Admin created successfully', token });
    }
  }else{
    res.status(406).json({message: 'Invalid Secret Key'})
  }
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.headers;
  const admin = ADMINS.find(a => a.username === username && a.password === password);
  if (admin) {
    const token = jwt.sign({ username, role: 'admin' }, ADMINSECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully', token });
  } else {
    res.status(403).json({ message: 'Invalid username or password' });
  }
});



app.post('/admin/courses', authenticateAdminJwt, (req, res) => {
  const course = req.body;
  course.id = COURSES.length + 1;
  COURSES.push(course);
  fs.writeFileSync('courses.json', JSON.stringify(COURSES));
  res.json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', authenticateAdminJwt, (req, res) => {
  const course = COURSES.find(c => c.id === parseInt(req.params.courseId));
  if (course) {
    Object.assign(course, req.body);
    fs.writeFileSync('courses.json', JSON.stringify(COURSES));
    res.json({ message: 'Course updated successfully' });
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/admin/courses', authenticateAdminJwt, (req, res) => {
  res.json({ courses: COURSES });
});

app.get('/admin/course/:courseId', authenticateAdminJwt, (req, res) => {
  const course = COURSES.find(course => course.id === parseInt(req.params.courseId))
  res.json(course)
});

app.delete('/admin/courseDelete/:courseId', authenticateAdminJwt,(req,res) => {
  const courseIndex = COURSES.findIndex(c => c.id === parseInt(req.params.courseId));
  if (courseIndex!==-1) {
    COURSES.splice(courseIndex, 1);
    fs.writeFileSync('courses.json', JSON.stringify(COURSES));
    res.json({ message: 'Course deleted successfully' });
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
})

// User routes
app.post('/users/signup', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username);
  if (user) {
    res.status(403).json({ message: 'User already exists' });
  } else {
    const newUser = { username, password };
    USERS.push(newUser);
    fs.writeFileSync('users.json', JSON.stringify(USERS));
    const token = jwt.sign({ username, role: 'user' }, USERSECRET, { expiresIn: '1h' });
    res.json({ message: 'User created successfully', token });
  }
});

app.post('/users/login', (req, res) => {
  const { username, password } = req.headers;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ username, role: 'user' }, USERSECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully', token });
  } else {
    res.status(403).json({ message: 'Invalid username or password' });
  }
});

app.get('/users/courses', authenticateUserJwt, (req, res) => {
  res.json({ courses: COURSES });
});

app.get('/users/course/:courseId', authenticateUserJwt, (req, res) => {
  const course = COURSES.find(course => course.id === parseInt(req.params.courseId))
  res.json(course)
});

app.post('/users/courses/:courseId', authenticateUserJwt, (req, res) => {
  const course = COURSES.find(c => c.id === parseInt(req.params.courseId));
  if (course) {
    const user = USERS.find(u => u.username === req.user.username);
    const coursePurchased = user.purchasedCourses.findIndex(c => c.id === course.id)
    if (user) {
      if (!user.purchasedCourses) {
        user.purchasedCourses = [];
      }else{
        if(coursePurchased !== -1){
          res.json({message: 'Course Already Purchased'});
        }else{
          user.purchasedCourses.push(course);
          fs.writeFileSync('users.json', JSON.stringify(USERS));
          res.json({ message: 'Course purchased successfully' });
        }
      }
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', authenticateUserJwt, (req, res) => {
  const user = USERS.find(u => u.username === req.user.username);
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: 'User not found' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
