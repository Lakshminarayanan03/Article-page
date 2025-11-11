
import './App.css'
import AboutPage from './pages/AboutPage'
import ArticleListPage from './pages/ArticleListPage'
import HomePage from './pages/HomePage'
import {
  createBrowserRouter, RouterProvider
} from 'react-router-dom'
import LayoutPage from './LayoutPage'
import ArticlePage, {loader as articleLoader} from './pages/ArticlePage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import CreateAccountPage from './pages/CreateAccountPage'



function App() {
  const routes = 
  [{
    path : '/',
    element : <LayoutPage/>,
    errorElement: <NotFoundPage />,
  children: [{
    path : '/',
    element : <HomePage />
  },
{
    path : '/about',
    element : <AboutPage />
  },
{
    path : '/articles',
    element : <ArticleListPage />
  },
{
    path : '/articles/:name',
    element : <ArticlePage />,
    loader: articleLoader,
},
{
  path:'/login',
  element:<LoginPage />
},
{
  path:'/create-account',
  element:<CreateAccountPage />
}

]
}]
  const router = createBrowserRouter(routes)
  return (
    <RouterProvider router={router} />
  )

}

export default App
