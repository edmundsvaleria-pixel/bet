import { useState } from 'react'

const Tooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false)

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div className={`absolute z-50 ${positionClasses[position]} px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap pointer-events-none`}>
          {text}
          <div className={`absolute ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-800' : position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800' : ''} border-4 border-transparent`} />
        </div>
      )}
    </div>
  )
}

export default Tooltip