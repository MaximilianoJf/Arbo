import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
// import { LoginView, RegisterView, loginAction, registerAction } from './views'
import { LoginView, RegisterView, loginAction, registerAction } from './features/auth'
import { CreateFormView } from './features/form-builder/views'
import FormBuilderLayout from './layouts/FormBuilderLayout'


export const router = createBrowserRouter([
    {
        path: '/',
        element: <AuthLayout />,
        children: [
            {
                index: true,
                element: < LoginView />,
                action: loginAction
            },
            {
                path: '/register',
                element: <RegisterView />,
                action: registerAction
            },
            {
                path: '/create-form/',
                element: <CreateFormView />,
            }
        ]
    },
    {
        path: '/form-builder',
        element: <FormBuilderLayout />,
        children: [
            {
                path: 'create-form', // Sin la barra inicial '/' para que sea relativa
                element: <CreateFormView />,
            }
        ]
    }
])




export { };