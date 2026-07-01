import { AppRouter } from "@/app/router"
import { ToastHost } from "@/components/feedback/ToastHost"

function App() {
  return (
    <>
      <AppRouter />
      <ToastHost />
    </>
  )
}

export default App