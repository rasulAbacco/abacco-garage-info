import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const FIELD_AGENT_LINKS = [
  {
    path: "/field-agent-dashboard",
    label: "Dashboard",
  },
  {
    path: "/field-agent-dashboard/attendance",
    label: "Attendance",
  },
  {
    path: "/field-agent-dashboard/add-visit",
    label: "Add Visit",
  },
  {
    path: "/field-agent-dashboard/my-visits",
    label: "My Visits",
  },
  {
    path: "/field-agent-dashboard/followups",
    label: "Follow-ups",
  },
  {
    path: "/field-agent-dashboard/profile",
    label: "Profile",
  },
];

const FieldAgentLayout = () => {
    return (
        <div className="lg:flex min-h-screen">
            <Sidebar
                role="FIELD_AGENT"
                links={FIELD_AGENT_LINKS}
            />

            <div className="flex-1 bg-[#F8F9FA] min-h-screen overflow-y-auto min-w-0">
                <Outlet />
            </div>
        </div>
    );
};

export default FieldAgentLayout;