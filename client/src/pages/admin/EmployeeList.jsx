import { useEffect, useState } from "react";

import API from "../../api/axios";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const response = await API.get("/api/auth/employees");
      setEmployees(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await API.put(`/api/auth/toggle/${id}`);

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                isActive: !emp.isActive,
              }
            : emp
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  const formatRole = (role) => {
    switch (role) {
      case "FIELD_AGENT":
        return "FIELD AGENT";
      case "ADMIN":
        return "ADMIN";
      case "EMPLOYEE":
        return "EMPLOYEE";
      default:
        return role;
    }
  };

  const formatMarketingType = (type) => {
    if (!type) return "-";

    return type
      .replaceAll("_", " ")
      .toUpperCase();
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="mt-10 bg-white border border-neutral-200 overflow-hidden">
      <div className="p-5 border-b border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-900">
          Employee List
        </h2>
      </div>

      {loading ? (
        <div className="p-10 text-center text-neutral-400">
          Loading employees...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-neutral-500">
                  Name
                </th>

                <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-neutral-500">
                  Email
                </th>

                <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-neutral-500">
                  Role
                </th>

                <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-neutral-500">
                  Marketing Type
                </th>

                <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-neutral-500">
                  Status
                </th>

                <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-neutral-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-neutral-100"
                >
                  <td className="px-5 py-4 text-sm text-neutral-800">
                    {emp.name}
                  </td>

                  <td className="px-5 py-4 text-sm text-neutral-600">
                    {emp.email}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-neutral-700">
                    {formatRole(emp.role)}
                  </td>

                  <td className="px-5 py-4 text-sm text-neutral-600">
                    {emp.role === "FIELD_AGENT"
                      ? formatMarketingType(emp.marketingType)
                      : "-"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        emp.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {emp.isActive
                        ? "ACTIVE"
                        : "DISABLED"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() =>
                        toggleStatus(emp.id)
                      }
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                        emp.isActive
                          ? "bg-green-500"
                          : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                          emp.isActive
                            ? "right-1"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;