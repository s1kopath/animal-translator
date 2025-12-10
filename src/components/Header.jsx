function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-4xl w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-2xl sm:text-3xl">🐾</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Animal Translator</h1>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
            Powered by AI 🧠
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

