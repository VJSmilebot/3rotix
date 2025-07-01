import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="bg-black text-white min-h-screen font-sans">
      <Navbar />
      <main className="flex flex-col items-center justify-center text-center py-32 px-4">
        {children}
      </main>
    </div>
  )
}