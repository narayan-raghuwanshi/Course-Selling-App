import UserSignup from "./components/user/UserSignup";
import UserSignin from "./components/user/UserSignin";
import UserPurchasedCourses from "./components/user/UserPurchasedCourses";
import UserAllCourses from "./components/user/UserAllCourses";
import UserAppbar from "./components/user/UserAppbar";
import Course from "./components/user/Course";
import CourseContent from "./components/user/CourseContent";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
function App() {
  return (
    <Router>
      <UserAppbar />
      <Routes>
        <Route path="/course/:courseId" element={<Course />} />
        <Route path="/usersignup" element={<UserSignup />} />
        <Route path="/usersignin" element={<UserSignin />} />
        <Route path="/userpurchasedcourses" element={<UserPurchasedCourses />} />
        <Route path="/userallcourses" element={<UserAllCourses />} />
        <Route path="/userappbar" element={<UserAppbar />} />
        <Route path="/coursecontent/:courseId" element={<CourseContent />} />
      </Routes>
    </Router>
  );
}

export default App;