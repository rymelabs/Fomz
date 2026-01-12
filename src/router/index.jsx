import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Intro from "../pages/Landing/Intro";
import DashboardLayout from "../layouts/DashboardLayout";
import MyForms from "../pages/Dashboard/MyForms";
import CreateForm from "../pages/Dashboard/CreateForm";
import Drafts from "../pages/Dashboard/Drafts";
import DashboardAnalytics from "../pages/Dashboard/Analytics";
import FormAnalytics from "../pages/Dashboard/FormAnalytics";
import BuilderMain from "../pages/Builder/BuilderMain";
import Preview from "../pages/Builder/Preview";
import FillFormFlow from "../pages/FillForm/FillFormFlow";
import ShortLinkRedirect from "../pages/ShortLinkRedirect";
import ResponsesDashboard from "../pages/Responses/ResponsesDashboard";
import Profile from "../pages/Dashboard/Profile";
import Notifications from "../pages/Dashboard/Notifications";
import LocalForms from "../pages/Dashboard/LocalForms";
import Pricing from "../pages/billing/Pricing";

const withDashboardLayout = (Component) => (
  <DashboardLayout>
    <Component />
  </DashboardLayout>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Intro />,
  },
  {
    path: "/dashboard",
    element: withDashboardLayout(MyForms),
  },
  {
    path: "/dashboard/create",
    element: withDashboardLayout(CreateForm),
  },
  {
    path: "/dashboard/drafts",
    element: withDashboardLayout(Drafts),
  },
  {
    path: "/dashboard/analytics",
    element: withDashboardLayout(DashboardAnalytics),
  },
  {
    path: "/dashboard/analytics/:formId",
    element: withDashboardLayout(FormAnalytics),
  },
  {
    path: "/dashboard/profile",
    element: withDashboardLayout(Profile),
  },
  {
    path: "/dashboard/notifications",
    element: withDashboardLayout(Notifications),
  },
  {
    path: "/local/forms",
    element: withDashboardLayout(LocalForms),
  },
  {
    path: "/builder",
    element: withDashboardLayout(BuilderMain),
  },
  {
    path: "/builder/preview",
    element: <Preview />,
  },
  {
    path: "/forms/:formId/fill",
    element: <FillFormFlow />,
  },
  {
    path: "/f/:shareId",
    element: <ShortLinkRedirect />,
  },
  {
    path: "/fill/:shareId",
    element: <FillFormFlow />,
  },
  {
    path: "/forms/:formId/responses",
    element: withDashboardLayout(ResponsesDashboard),
  },
  {
    path: "/dashboard/forms",
    element: withDashboardLayout(MyForms),
  },
  {
    path: "*",
    element: <Intro />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
]);

export default router;
