function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">🐾</span>
            <h1 className="text-2xl font-bold text-gray-800">Animal Translator</h1>
          </div>
          <div className="text-sm text-gray-600">
            Powered by AI 🧠
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

