// client/src/routes/AppRoutes.jsx

import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";

import AdminLayout from "../layouts/AdminLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";
import FieldAgentLayout from "../layouts/FieldAgentLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminEmployees from "../pages/admin/AdminEmployees";
import AdminReports from "../pages/admin/AdminReports";
import AdminSettings from "../pages/admin/AdminSettings";
import AddEmployee from "../pages/admin/AddEmployee";
import AdminAttendance from "../pages/admin/AdminAttendance";
import AdminGarageVisits from "../pages/admin/AdminGarageVisits";
import AdminSchools from "../pages/admin/AdminSchools";
import AdminVehicles from "../pages/admin/AdminVehicles";

import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import EmployeeLeads from "../pages/employee/EmployeeLeads";
import EmployeeVisits from "../pages/employee/EmployeeVisits";
import AddGarageVisit from "../pages/employee/AddGarageVisit";
import EmployeeAttendance from "../pages/employee/EmployeeAttendance";
import EmployeeFollowUps from "../pages/employee/EmployeeFollowUps";
import AddSchool from "../pages/employee/AddSchool";
import EmployeeSchools from "../pages/employee/EmployeeSchools";

import SchoolDetails from "../pages/shared/SchoolDetails";

// FIELD AGENT
import FieldAgentDashboard from "../pages/field-agent/FieldAgentDashboard";
import FieldAgentAttendance from "../pages/field-agent/FieldAgentAttendance";
import FieldAgentMyVisits from "../pages/field-agent/FieldAgentMyVisits";
import FieldAgentFollowUps from "../pages/field-agent/FieldAgentFollowUps";
import FieldAgentReports from "../pages/field-agent/FieldAgentReports";
import FieldAgentProfile from "../pages/field-agent/FieldAgentProfile";
import FieldAgentAddVisit from "../pages/field-agent/FieldAgentAddVisit";
import FieldAgentVisitDetails from "../pages/field-agent/FieldAgentVisitDetails";
import FieldAgentEditVisit from "../pages/field-agent/FieldAgentEditVisit";
import ProtectedRoute from "../components/common/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>

      {/* LOGIN */}
      <Route path="/" element={<Login />} />

      {/* ===================== ADMIN ===================== */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />

        <Route
          path="employees"
          element={<AdminEmployees />}
        />

        <Route
          path="reports"
          element={<AdminReports />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />

        <Route
          path="add-employee"
          element={<AddEmployee />}
        />

        <Route
          path="attendance"
          element={<AdminAttendance />}
        />

        <Route
          path="garage-visits"
          element={<AdminGarageVisits />}
        />

        <Route
          path="schools"
          element={<AdminSchools />}
        />

        <Route
          path="schools/:id"
          element={<SchoolDetails />}
        />

        <Route
          path="vehicles"
          element={<AdminVehicles />}
        />
      </Route>

      {/* ===================== EMPLOYEE ===================== */}
      <Route
        path="/employee-dashboard"
        element={
          <ProtectedRoute>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />

        <Route
          path="attendance"
          element={<EmployeeAttendance />}
        />

        <Route
          path="add-garage"
          element={<AddGarageVisit />}
        />

        <Route
          path="add-school"
          element={<AddSchool />}
        />

        <Route
          path="schools"
          element={<EmployeeSchools />}
        />

        <Route
          path="schools/:id"
          element={<SchoolDetails />}
        />

        <Route
          path="followups"
          element={<EmployeeFollowUps />}
        />

        <Route
          path="leads"
          element={<EmployeeLeads />}
        />

        <Route
          path="visits"
          element={<EmployeeVisits />}
        />
      </Route>

      {/* ===================== FIELD AGENT ===================== */}
      <Route
        path="/field-agent-dashboard"
        element={
          <ProtectedRoute>
            <FieldAgentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FieldAgentDashboard />} />

        <Route
          path="attendance"
          element={<FieldAgentAttendance />}
        />

        <Route
          path="add-visit"
          element={<FieldAgentAddVisit />}
        />

        <Route
          path="my-visits"
          element={<FieldAgentMyVisits />}
        />

        <Route
          path="followups"
          element={<FieldAgentFollowUps />}
        />

        <Route
          path="profile"
          element={<FieldAgentProfile />}
        />

        <Route
          path="visit/:id"
          element={<FieldAgentVisitDetails />}
        />

        <Route
          path="edit-visit/:id"
          element={<FieldAgentEditVisit />}
        />
      </Route>

    </Routes>
  );
};

export default AppRoutes;