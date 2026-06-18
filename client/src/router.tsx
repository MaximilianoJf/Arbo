import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import FormBuilderLayout from "./layouts/FormBuilderLayout";
import { LoginView, RegisterView, loginAction, registerAction } from "./features/auth";
import {
    CreateFormView, DashboardView, EditFormView, PublicFormView,
    ResponsesView, SharedView, ArchiveView, TrashView, EmbedFormView,
    ProjectsView, ProjectDetailView, ApiKeysView, OpenRouterSettingsView,
    ComponentsLibraryView, FormRelationsView, ProjectPortalView,
} from "./features/form-builder/views";
import { PortalDashboard } from "./features/form-builder/views/portal/PortalDashboard";
import { PortalForms } from "./features/form-builder/views/portal/PortalForms";
import { PortalUsers } from "./features/form-builder/views/portal/PortalUsers";
import { PortalSettings } from "./features/form-builder/views/portal/PortalSettings";
import { PortalResponses } from "./features/form-builder/views/portal/PortalResponses";
import { PortalRespondents } from "./features/form-builder/views/portal/PortalRespondents";
import { PortalAnalysis } from "./features/form-builder/views/portal/PortalAnalysis";
import { PortalDatabase } from "./features/form-builder/views/portal/PortalDatabase";
import { PortalDocs } from "./features/form-builder/views/portal/PortalDocs";
import { PortalAgent } from "./features/form-builder/views/portal/PortalAgent";
import { NotFoundView } from "./features/not-found/NotFoundView";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AuthLayout />,
        children: [
            {
                index: true,
                element: <LoginView />,
                action: loginAction,
            },
            {
                path: "register",
                element: <RegisterView />,
                action: registerAction,
            },
        ],
    },
    {
        path: "/form-builder",
        element: <FormBuilderLayout />,
        children: [
            {
                index: true,
                element: <DashboardView />,
            },
            {
                path: "create-form",
                element: <CreateFormView />,
            },
            {
                path: "edit/:id",
                element: <EditFormView />,
            },
            {
                path: "responses/:id",
                element: <ResponsesView />,
            },
            {
                path: "shared",
                element: <SharedView />,
            },
            {
                path: "archive",
                element: <ArchiveView />,
            },
            {
                path: "trash",
                element: <TrashView />,
            },
            {
                path: "projects",
                element: <Navigate to="/form-builder" replace />,
            },
            {
                path: "projects/:id",
                element: <ProjectDetailView />,
            },
            {
                path: "components",
                element: <ComponentsLibraryView />,
            },
            {
                path: "projects/:id/relations",
                element: <FormRelationsView />,
            },
            {
                path: "api-keys",
                element: <ApiKeysView />,
            },
            {
                path: "settings/openrouter",
                element: <OpenRouterSettingsView />,
            },
        ],
    },
    {
        path: "/p/:id",
        element: <ProjectPortalView />,
        children: [
            { index: true, element: <PortalDashboard /> },
            { path: "forms", element: <PortalForms /> },
            { path: "responses", element: <PortalResponses /> },
            { path: "respondents", element: <PortalRespondents /> },
            { path: "docs", element: <PortalDocs /> },
            { path: "analysis", element: <PortalAnalysis /> },
            { path: "database", element: <PortalDatabase /> },
            { path: "agent", element: <PortalAgent /> },
            { path: "users", element: <PortalUsers /> },
            { path: "settings", element: <PortalSettings /> },
        ],
    },
    {
        path: "/embed/:slug",
        element: <EmbedFormView />,
    },
    {
        path: "/forms/:slug",
        element: <PublicFormView />,
    },
    {
        path: "*",
        element: <NotFoundView />,
    },
]);
