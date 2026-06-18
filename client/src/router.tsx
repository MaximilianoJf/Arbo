import { createBrowserRouter } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import FormBuilderLayout from "./layouts/FormBuilderLayout";
import { LoginView, RegisterView, loginAction, registerAction } from "./features/auth";
import {
    CreateFormView, DashboardView, EditFormView, PublicFormView,
    ResponsesView, SharedView, ArchiveView, TrashView, EmbedFormView,
    ProjectsView, ProjectDetailView, ApiKeysView, OpenRouterSettingsView,
} from "./features/form-builder/views";
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
                element: <ProjectsView />,
            },
            {
                path: "projects/:id",
                element: <ProjectDetailView />,
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
