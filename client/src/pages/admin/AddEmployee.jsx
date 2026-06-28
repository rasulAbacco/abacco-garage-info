import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import API from "../../api/axios";
import EmployeeList from "./EmployeeList";

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    marketingType: "GARAGE",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    const updated = {
      ...prev,
      [name]: value,
    };

    // Reset marketing type when role changes
    if (name === "role" && value !== "FIELD_AGENT") {
      updated.marketingType = "GARAGE";
    }

    return updated;
  });
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await API.post("/api/auth/register", formData);

      alert(response.data.message);

      // Reset form data completely after successful submission
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        marketingType: "GARAGE",
      });
    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* FORM CARD */}
        <div className="xl:col-span-1">
          <div className="bg-white border border-neutral-200 p-5 sm:p-6 md:p-8 shadow-sm sticky top-6">
            
            {/* Header */}
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-bold mb-2">
                — ADMIN CONTROL —
              </p>
              <h1 className="text-2xl sm:text-3xl font-light text-neutral-900">
                Add Employee
              </h1>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Create and manage employee or admin accounts.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email address"
                  className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter password"
                    className="w-full border border-neutral-300 px-4 py-3 pr-12 text-sm outline-none focus:border-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black transition-all bg-white"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="FIELD_AGENT">FIELD AGENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* Marketing Type Dropdown (Conditional) */}
              {formData.role === "FIELD_AGENT" && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Marketing Type
                  </label>
                  <select
                    name="marketingType"
                    value={formData.marketingType}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black transition-all bg-white"
                  >
                    <option value="GARAGE">Garage</option>
                    <option value="SCHOOL">School</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="GENERAL">General Marketing</option>
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 text-sm sm:text-base hover:bg-neutral-800 transition-all disabled:opacity-70"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>

        {/* EMPLOYEE LIST */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <EmployeeList />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddEmployee;