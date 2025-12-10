const animals = [
  { name: 'Dog', emoji: '🐕', color: 'from-yellow-400 to-orange-500' },
  { name: 'Cat', emoji: '🐱', color: 'from-gray-400 to-gray-600' },
  { name: 'Bird', emoji: '🐦', color: 'from-blue-400 to-blue-600' },
  { name: 'Cow', emoji: '🐄', color: 'from-white to-gray-300' },
  { name: 'Pig', emoji: '🐷', color: 'from-pink-400 to-pink-600' },
  { name: 'Rooster', emoji: '🐓', color: 'from-red-400 to-red-600' },
  { name: 'Duck', emoji: '🦆', color: 'from-yellow-300 to-yellow-500' },
  { name: 'Sheep', emoji: '🐑', color: 'from-white to-gray-200' },
  { name: 'Horse', emoji: '🐴', color: 'from-amber-400 to-amber-600' },
  { name: 'Lion', emoji: '🦁', color: 'from-yellow-500 to-orange-600' },
]

function AnimalSelector({ selectedAnimal, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {animals.map((animal) => {
        const isSelected = selectedAnimal?.name === animal.name
        return (
          <button
            key={animal.name}
            onClick={() => onSelect(animal)}
            className={`
              relative overflow-hidden rounded-xl p-4 transition-all duration-300
              transform hover:scale-105 active:scale-95
              ${isSelected 
                ? `bg-gradient-to-br ${animal.color} shadow-lg ring-4 ring-primary-400` 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:shadow-md'
              }
            `}
          >
            <div className="text-5xl mb-2">{animal.emoji}</div>
            <div className={`
              text-sm font-semibold
              ${isSelected ? 'text-white' : 'text-gray-700'}
            `}>
              {animal.name}
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2">
                <span className="text-white text-lg">✓</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default AnimalSelector

