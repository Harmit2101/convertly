import { BrowserRouter, Route, Routes } from "react-router-dom"

import HomePage from "@/pages/HomePage"

const routeConfig = [
  {
    path: "/",
    element: <HomePage />,
  },
]

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {routeConfig.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </BrowserRouter>
  )
}

export { AppRouter }
