import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import { LoginView, RegisterView, loginAction, registerAction } from './views'



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
            }
        ]
    }
])

export { };